/**
 * Script to check user plan details
 * Run with: node checkUserPlan.js vikashdotdev@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Institution = require('./src/models/Institution');
const { getEffectivePlan } = require('./src/services/institutionPlanService');

const emailToCheck = process.argv[2] || 'vikashdotdev@gmail.com';

async function checkUserPlan() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find user by email
    const user = await User.findOne({ email: emailToCheck.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User with email "${emailToCheck}" not found`);
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('USER PLAN DETAILS');
    console.log('='.repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.displayName}`);
    console.log(`User ID: ${user._id}`);
    console.log('\n--- User Subscription Details ---');
    console.log(`Plan: ${user.subscription?.plan || 'N/A'}`);
    console.log(`Status: ${user.subscription?.status || 'N/A'}`);
    console.log(`Start Date: ${user.subscription?.startDate ? new Date(user.subscription.startDate).toLocaleDateString() : 'N/A'}`);
    console.log(`End Date: ${user.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString() : 'N/A'}`);
    console.log(`Original Plan: ${user.subscription?.originalPlan?.plan || 'N/A'}`);
    console.log(`Original Plan Status: ${user.subscription?.originalPlan?.status || 'N/A'}`);
    
    console.log('\n--- Institution User Status ---');
    console.log(`isInstitutionUser: ${user.isInstitutionUser || false}`);
    console.log(`institutionId: ${user.institutionId || 'N/A'}`);

    // Get effective plan if institution user
    let effectivePlan = null;
    if (user.isInstitutionUser && user.institutionId) {
      console.log('\n--- Calculating Effective Plan ---');
      try {
        effectivePlan = await getEffectivePlan(user);
        console.log(`Effective Plan: ${effectivePlan.plan}`);
        console.log(`Effective Status: ${effectivePlan.status}`);
        console.log(`Effective End Date: ${effectivePlan.endDate ? new Date(effectivePlan.endDate).toLocaleDateString() : 'N/A'}`);
        console.log(`Source: ${effectivePlan.source || 'N/A'}`);

        // Get institution details
        const institution = await Institution.findById(user.institutionId);
        if (institution) {
          console.log('\n--- Institution Details ---');
          console.log(`Institution Name: ${institution.name}`);
          console.log(`Institution Email: ${institution.email}`);
          console.log(`Admin Email: ${institution.adminEmail}`);
          console.log(`Institution Subscription Plan: ${institution.subscription?.plan || 'N/A'}`);
          console.log(`Institution Subscription Status: ${institution.subscription?.status || 'N/A'}`);
          console.log(`Institution Subscription Start Date: ${institution.subscription?.startDate ? new Date(institution.subscription.startDate).toLocaleDateString() : 'N/A'}`);
          console.log(`Institution Subscription End Date: ${institution.subscription?.endDate ? new Date(institution.subscription.endDate).toLocaleDateString() : 'N/A'}`);
          
          // Check if institution subscription is active
          const now = new Date();
          const endDate = institution.subscription?.endDate ? new Date(institution.subscription.endDate) : null;
          const isExpired = endDate && endDate < now;
          console.log(`\nInstitution Subscription Status Check:`);
          console.log(`  - Current Date: ${now.toLocaleDateString()}`);
          console.log(`  - End Date: ${endDate ? endDate.toLocaleDateString() : 'No end date'}`);
          console.log(`  - Is Expired: ${isExpired ? 'YES' : 'NO'}`);
          console.log(`  - Status Field: ${institution.subscription?.status || 'N/A'}`);
        } else {
          console.log('\n⚠️  Institution not found in database!');
        }
      } catch (error) {
        console.log(`\n❌ Error calculating effective plan: ${error.message}`);
        console.error(error);
      }
    } else {
      console.log('\n--- Effective Plan ---');
      console.log('User is NOT an institution user, so effective plan = subscription plan');
      console.log(`Effective Plan: ${user.subscription?.plan || 'free'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Current Plan in Database: ${user.subscription?.plan || 'free'}`);
    if (effectivePlan) {
      console.log(`Effective Plan (what should be displayed): ${effectivePlan.plan}`);
      console.log(`Effective Status: ${effectivePlan.status}`);
    } else {
      console.log(`Effective Plan (what should be displayed): ${user.subscription?.plan || 'free'}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserPlan();

