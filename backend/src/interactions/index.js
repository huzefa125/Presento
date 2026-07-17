const multipleChoice = require('./multipleChoice');
const wordCloud = require('./wordCloud');
const openEnded = require('./openEnded');
const scales = require('./scales');
const ranking = require('./ranking');
const qna = require('./qna');
const guessNumber = require('./guessNumber');
const hundredPoints = require('./hundredPoints');
const twoByTwoGrid = require('./twoByTwoGrid');
const pinOnImage = require('./pinOnImage');
const quiz = require('./quiz');
const pickAnswer = require('./pickAnswer');
const typeAnswer = require('./typeAnswer');
const miro = require('./miro');
const powerpoint = require('./powerpoint');
const googleSlides = require('./googleSlides');

const handlers = {
  multiple_choice: multipleChoice,
  word_cloud: wordCloud,
  open_ended: openEnded,
  scales: scales,
  ranking: ranking,
  qna: qna,
  guess_number: guessNumber,
  hundred_points: hundredPoints,
  '2x2_grid': twoByTwoGrid,
  pin_on_image: pinOnImage,
  quiz: quiz,
  pick_answer: pickAnswer,
  type_answer: typeAnswer,
  miro: miro,
  powerpoint: powerpoint,
  google_slides: googleSlides,
};

function getHandler(type) {
  return handlers[type];
}

module.exports = { getHandler };