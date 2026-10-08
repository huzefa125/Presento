# Code Standards

This repo has two apps - `backend/` (Express + MongoDB) and `frontend/` (React + Vite).
Both already had the right pieces (an error-handling middleware, an API client with
interceptors, a services layer) but only part of the codebase used them, so the same
problem kept getting re-solved slightly differently in every file. This document
describes the shared layer that now exists and the pattern to follow when you touch a
file that still does it the old way.

**Don't mass-migrate.** When you're working in a file, bring it in line with the
pattern below. Don't go rewrite unrelated files in the same PR - that makes diffs hard
to review and risks behavior changes nobody asked for.

---

## Backend (`backend/src`)

### The toolkit: `require('../utils')`

Every controller should start with one import:

```js
const {
  asyncHandler, ok, created, paginated, message, notFound, badRequest,
  forbidden, conflict, tooManyRequests, serverError,
  parsePagination, buildPagination, Logger
} = require('../utils');
```

This barrel (`backend/src/utils/index.js`) re-exports everything below. You rarely need
to reach into `apiResponse.js` / `httpErrors.js` / `pagination.js` / `logger.js`
directly - import from `../utils` and take what you need.

### Every route handler is wrapped in `asyncHandler`

```js
exports.getTestimonialById = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) throw notFound('Testimonial');
  ok(res, { testimonial });
});
```

No `try`/`catch` in the controller. `asyncHandler` (in
`middleware/errorHandler.js`) catches the rejection and forwards it to the centralized
`errorHandler` middleware, which logs it and emits the response. Writing `try { ... }
catch (error) { console.error(...); res.status(500).json({...}) }` in a new handler is
the thing this replaces - if you find yourself typing that, stop and use
`asyncHandler` instead.

### Failures: throw, don't build a response

```js
const { notFound, badRequest, forbidden, conflict, tooManyRequests } = require('../utils');

if (!testimonial) throw notFound('Testimonial');                 // 404
if (existing) throw badRequest('Email already in use');          // 400
if (!isOwner) throw forbidden();                                 // 403
if (duplicate) throw conflict('Resource already exists');        // 409
if (recent) throw tooManyRequests('Please wait before retrying'); // 429
```

Each factory is `new AppError(message, statusCode, code)` under the hood. The `code`
field is a stable machine-readable string (`RESOURCE_NOT_FOUND`, `RATE_LIMITED`, ...) -
keep using the existing `code` values already in use elsewhere in the codebase
(`EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, etc.) by passing them as the factory's
second argument, e.g. `badRequest('An account with this email already exists',
'EMAIL_ALREADY_EXISTS')`, rather than inventing new ones, since the frontend may branch
on `error.response.data.code`.

### Success: use the matching helper, don't hand-build the envelope

```js
ok(res, data, message?)        // 200, { success: true, message?, data? }
created(res, data, message?)   // 201, same shape
message(res, text)             // 200, { success: true, message } - no data (e.g. a delete)
paginated(res, key, items, pagination, extra?)
  // 200, { success: true, data: { [key]: items, pagination, ...extra } }
noContent(res)                 // 204, empty body
```

`paginated` takes the array's property name explicitly (`'users'`, `'testimonials'`)
so the response reads `data.testimonials`, matching what's already on the wire - it
never introduces a generic `data.items` the frontend would have to special-case.

### Pagination: parse once, build once

```js
const { page, limit, skip } = parsePagination(req.query); // clamps limit to 100, defaults to page 1 / limit 10
const [items, total] = await Promise.all([
  Model.find(query).skip(skip).limit(limit).lean(),
  Model.countDocuments(query)
]);
paginated(res, 'items', items, buildPagination(page, limit, total));
```

Hand-rolled `parseInt(req.query.page) || 1` / `Math.ceil(total / limit)` is what this
replaces - in particular, the hand-rolled version doesn't clamp `limit`, so
`?limit=100000` was free to scan an entire collection.

### Models: import from the barrel

```js
const { User, Testimonial, Presentation } = require('../models');
```

`models/index.js` exports all 15 models. If you add a new model file, add it to this
barrel in the same PR - a model missing from the barrel is exactly why the two import
styles (`require('../models/User')` vs `require('../models')`) drift apart.

### Logging: `Logger`, not `console.*`

```js
const { Logger } = require('../utils');
Logger.error('Payment webhook failed', err); // always shown
Logger.warn('Falling back to default plan');  // shown unless LOG_LEVEL=error
Logger.info('Cache warmed');                  // dev-level detail
```

`console.*` bypasses the level filtering `Logger` already does (see
`backend/src/utils/logger.js`) and the timestamp/level formatting every other log line
has.

### Reference migration

`backend/src/controllers/testimonialController.js` was rewritten end-to-end using this
toolkit - 10 duplicated `try { ... } catch (error) { console.error(...);
res.status(500).json(...) }` blocks became 10 plain `asyncHandler` functions with the
same response bodies, status codes and messages (verified against the original with a
mocked-model integration test, not just by eye). Use it as the template.

---

## Frontend (`frontend/src`)

### The toolkit

| Need | Import |
|---|---|
| Call the API | `import api from '../config/api'` (axios instance, already attaches the active session token) |
| Loading/error/data around an API call | `import { useAsync } from '../hooks/useAsync'` |
| Read an error's message | `import { getErrorMessage } from '../lib/apiError'` |
| Dev-only logging | `import { logger } from '../lib/logger'` |
| Read/write a session token | `import { getUserToken, setUserToken, ... } from '../lib/tokens'` |
| Merge Tailwind classes | `import { cn } from '../utils/cn'` |

### Fetching: `useAsync` instead of three `useState`s

```js
const log = logger.scope('UsersList');
const { loading, run } = useAsync();

const fetchUsers = () => run(
  () => api.get('/super-admin/users', { params: { page, limit, ...filters } }),
  {
    onSuccess: (response) => {
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    },
    onError: (err) => {
      log.error('Error fetching users:', err);
      toast.error('Failed to load users');
    }
  }
);
```

This is what replaces:

```js
const [loading, setLoading] = useState(false);
// ...
try {
  setLoading(true);
  const response = await api.get(...);
  // ...
} catch (error) {
  console.error(...);
  toast.error(...);
} finally {
  setLoading(false);
}
```

`useAsync` also guards against race conditions: if the user changes a filter before
the first request resolves, the stale response is dropped instead of overwriting
newer state. If a component only needs the loading flag and a success/error callback
(no need to keep the resolved value around), that's exactly the pattern above - `data`
and `setData` are there for the simpler case of a fetch that just needs the result
held in state as-is.

### Reading an error message

```js
toast.error(getErrorMessage(err));                 // "Email already in use"
toast.error(getErrorMessage(err, 'Could not save')); // falls back if nothing is extractable
```

This reads `err.response.data.message`, then `.error`, then `err.message`, in that
order - replacing the `err.response?.data?.message || err.response?.data?.error ||
err.message || 'Something went wrong'` chains that used to be retyped (slightly
differently each time) at every call site. For translated copy, pass the result (or
the raw error) through `utils/errorTranslator.js`'s `translateError` as before - that
piece hasn't changed.

### Tokens: never touch `localStorage`/`sessionStorage` directly

```js
import { getActiveToken, setUserToken, clearUserToken } from '../lib/tokens';
```

There are three sessions (`jwtToken` in `localStorage`; `superAdminToken` and
`institutionAdminToken` in `sessionStorage`), with admin sessions taking precedence
over a regular user session. `config/api.js`'s request interceptor and `AuthContext`
both read/write through this module now - if you need the current token or need to
sign a session out, use the matching function here rather than calling
`localStorage.getItem('jwtToken')` inline. That precedence rule is also why
`setUserToken` clears any leftover admin token: otherwise `api.js` would keep
attaching the stale admin token instead and every request would fail signature
verification.

### Logging: `logger`, not `console.*`

```js
const log = logger.scope('UsersList'); // every line below now reads [UsersList] ...
log.error('Save failed', err); // always shown, even in production
log.debug('refetch', { page });  // dropped in a production build
```

### Reference migration

`frontend/src/components/SuperAdmin/Users/UsersList.jsx` was migrated to `useAsync` +
`logger` as the template - same loading state, same success/error behavior, same toast
copy, less boilerplate. `frontend/src/context/AuthContext.jsx` and
`frontend/src/config/api.js` were updated to route through `lib/tokens.js` and
`lib/apiError.js` themselves, since those two files are what the new `lib/` modules
exist to replace.

---

## Linting and formatting

Both apps now have the same pair of tools, run the same way:

```bash
npm run lint      # eslint . - ran separately in frontend/ and backend/
npm run format    # prettier --write . - same prettier config at the repo root
```

`backend/` had neither configured before; its `eslint.config.js` is deliberately kept
on the same major version and shape as `frontend/eslint.config.js` (flat config,
`@eslint/js` recommended + `eslint-config-prettier` last in the `extends` chain) so the
two don't drift into different styles of their own. `.prettierrc.json`,
`.prettierignore` and `.editorconfig` live at the repo root and apply to both apps.

Existing lint findings were **not** mass-fixed in this pass (204 pre-existing frontend
errors, 193 backend) - fix the ones in a file while you're already in it, the same rule
as the pattern migration above. A handful of the backend findings are real latent bugs
worth a look when you're next in those files: duplicate object keys in
`src/models/Slide.js` and `src/services/subscriptionService.js` (the second definition
silently wins), and a `hasOwnProperty` called directly on an object rather than via
`Object.prototype.hasOwnProperty.call(...)` in `src/utils/logger.js`.
