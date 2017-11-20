'use strict';
const Alexa = require('alexa-sdk');
const _ = require('lodash');

const words = require('./lib/words.json');
const audio_handlers = require('./lib/audio_handlers');

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this:  const APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
const APP_ID = 'amzn1.ask.skill.7065ccdb-53e8-42aa-b78a-d8a5d15a5486';

//We have provided two ways to create your quiz questions.  The default way is to phrase all of your questions like: "What is X of Y?"
//If this approach doesn't work for your data, take a look at the commented code in this function.  You can write a different question
//structure for each property of your data.
function getQuestion(word)
{
    return "What is the first letter in the word <break strength=\"medium\"/> <emphasis level=\"strong\">"+word+"</emphasis>?";
}

//This is the function that returns an answer to your user during the quiz.  Much like the "getQuestion" function above, you can use a
//switch() statement to create different responses for each property in your data.  For example, when this quiz has an answer that includes
//a state abbreviation, we add some SSML to make sure that Alexa spells that abbreviation out (instead of trying to pronounce it.)
function getAnswer(word, firstLetter, letterSaid)
{
    return "The letter I heard was "+letterSaid+"<break strength=\"medium\"/> The first letter in the word <emphasis>"+word+"</emphasis> is <break strength=\"medium\"/> <emphasis level=\"strong\">"+firstLetter+"</emphasis> <break strength=\"medium\"/>";
}

//This is a list of positive speechcons that this skill will use when a user gets a correct answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsCorrect = ["Booya", "All righty", "Bam", "Bazinga", "Bingo", "Boom", "Bravo", "Cha Ching", "Cheers", "Dynomite",
"Hip hip hooray", "Hurrah", "Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap", "Phew",
"Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa"];

//This is a list of negative speechcons that this skill will use when a user gets an incorrect answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsWrong = ["Argh", "Aw man", "Blarg", "Blast", "Boo", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk", "Le sigh",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Wah wah", "Whoops a daisy", "Yikes"];

//This is the welcome message for when a user starts the skill without a specific intent.
const WELCOME_MESSAGE = "Welcome to the Letter Head Quiz Game!  You can ask me to play the letter song, or you can ask me to start a quiz.  What would you like to do?";

//This is the message a user will hear when they start a quiz.
const START_QUIZ_MESSAGE = "OK.  I will ask you 10 questions.";

//This is the message a user will hear when they try to cancel or stop the skill, or when they finish a quiz.
const EXIT_SKILL_MESSAGE = "Thank you for playing the Letter Head Quiz Game!  Let's play again soon!";

//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = "You can ask me to play the letter song.  You can also test your knowledge by asking me to start a quiz.  What would you like to do?";

//This is the message a user will receive after they complete a quiz.  It tells them their final score.
function getFinalScore(score, counter) { return "Your final score is " + score + " out of " + counter + ". "; }


//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================

const counter = 0;

const states = {
    START: "_START",
    QUIZ: "_QUIZ"
};

const handlers = {
    "LaunchRequest": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
    },
    "QuizIntent": function() {
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
    },
    "AMAZON.HelpIntent": function() {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
    }
};

const startHandlers = Alexa.CreateStateHandler(states.START,{
    "Start": function() {
        console.log('Start.Start');
        this.response.speak(WELCOME_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "QuizIntent": function() {
        console.log('Start.QuizIntent');
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
    },
    "AMAZON.StopIntent": function() {
        console.log('Start.AMAZON.StopIntent');
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        console.log('Start.AMAZON.CancelIntent');
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function() {
        console.log('Start.AMAZON.HelpIntent');
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        console.log('Start.Unhandled');
        this.emitWithState("Start");
    }
});


const quizHandlers = Alexa.CreateStateHandler(states.QUIZ,{
    "Quiz": function() {
        console.log('Quiz.Quiz');
        this.attributes["response"] = "";
        this.attributes["counter"] = 0;
        this.attributes["quizscore"] = 0;
        this.emitWithState("AskQuestion");
    },
    "AskQuestion": function() {
        console.log('Quiz.AskQuestion');
        if (this.attributes["counter"] == 0)
        {
            this.attributes["response"] = START_QUIZ_MESSAGE + " ";
        }

        let random = getRandom(0, _.size(words)-1);
        let word = words[random];

        this.attributes["quizword"] = word;
        this.attributes["counter"]++;

        let question = getQuestion(word);
        let speech = this.attributes["response"] + question;

        this.emit(":ask", speech, question);
    },
    "AnswerIntent": function() {
        console.log('Quiz.AnswerIntent');
        if (_.isEqual(this.event.request.type, 'SessionEndedRequest')) {
            this.response.speak(EXIT_SKILL_MESSAGE);
            this.emit(":responseReady");
            return;
        }
        let response = "";
        let speechOutput = "";
        let word = this.attributes["quizword"];
        let firstLetter = _.head(_.split(word, ''));

        if (_.isNil(this.event.request.intent) || _.isNil(this.event.request.intent.slots) || _.isNil(this.event.request.intent.slots.Letter)) {
            this.response.speak(EXIT_SKILL_MESSAGE);
            this.emit(":responseReady");
            return;
        }

        let wordSaid = this.event.request.intent.slots.Letter.value;

        if (_.isNil(wordSaid) || _.isEmpty(_.trim(wordSaid))) {
            this.response.speak(EXIT_SKILL_MESSAGE);
            this.emit(":responseReady");
            return;
        }

        const letterSaid = _.head(_.split(wordSaid, ''));
        const correct = !_.isNil(letterSaid) && _.size(wordSaid) <= 2 && _.isEqual(_.toLower(letterSaid), _.toLower(firstLetter));

        console.log('Word: '+word);
        console.log('First letter: '+firstLetter);
        console.log('Said: '+ wordSaid);
        console.log('Letter said: '+letterSaid);

        if (correct)
        {
            response = getSpeechCon(true);
            this.attributes["quizscore"]++;
        }
        else
        {
            response = getSpeechCon(false);
            response += getAnswer(word, firstLetter, letterSaid);
        }

        if (this.attributes["counter"] < 10)
        {
            this.attributes["response"] = response;
            this.emitWithState("AskQuestion");
        }
        else
        {
            response += getFinalScore(this.attributes["quizscore"], this.attributes["counter"]);
            speechOutput = response + " " + EXIT_SKILL_MESSAGE;

            this.response.speak(speechOutput);
            this.emit(":responseReady");
        }
    },
    "AMAZON.RepeatIntent": function() {
        console.log('Quiz.AMAZON.RepeatIntent');
        let question = getQuestion(this.attributes["counter"], this.attributes["quizword"]);
        this.response.speak(question).listen(question);
        this.emit(":responseReady");
    },
    "AMAZON.StartOverIntent": function() {
        console.log('Quiz.AMAZON.StartOverIntent');
        this.emitWithState("Quiz");
    },
    "AMAZON.StopIntent": function() {
        console.log('Quiz.AMAZON.StopIntent');
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        console.log('Quiz.AMAZON.CancelIntent');
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function() {
        console.log('Quiz.AMAZON.HelpIntent');
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function() {
        console.log('Quiz.AnswerIntent');
        this.emitWithState("AnswerIntent");
    }
});

function getRandom(min, max)
{
    return Math.floor(Math.random() * (max-min+1)+min);
}

function getSpeechCon(type)
{
    if (type) return "<say-as interpret-as='interjection'>" + speechConsCorrect[getRandom(0, speechConsCorrect.length-1)] + "! </say-as><break strength='strong'/>";
    else return "<say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length-1)] + " </say-as><break strength='strong'/>";
}

exports.handler = (event, context) => {
    console.log(JSON.stringify(event, null, 3));
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers, startHandlers, quizHandlers, audio_handlers.audioEventHandlers, audio_handlers.stateHandlers);
    alexa.execute();
};
