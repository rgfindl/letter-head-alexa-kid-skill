'use strict';

const _ = require('lodash');

const SONGS = [
    {
        artist: 'Mary Kate',
        url: 'https://word-up-alexa-kid-skill-publicassetsbucket-fgb1xhh6iib5.s3.amazonaws.com/Mary-Kate_ABC.mp3'
    },
    {
        artist: 'Jacob',
        url: 'https://word-up-alexa-kid-skill-publicassetsbucket-fgb1xhh6iib5.s3.amazonaws.com/Jacob_ABC.mp3'
    }
];

function getRandom(min, max)
{
    return Math.floor(Math.random() * (max-min+1)+min);
}

var controller = function () {
    return {
        play: function (artist) {
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */
            if (!_.isNil(artist)) {
                var song = _.find(SONGS, {artist: artist});
            } else {
                var song = SONGS[getRandom(0,1)];
            }
            const text = 'This is the letter song by '+song.artist;

            this.response.speak(text).audioPlayerPlay('REPLACE_ALL', song.url, song.url, null, 0);
            this.emit(':responseReady');
        },
        stop: function () {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        }
    }
}();

var handlers = {
    stateHandlers: {
        'SongIntent': function () {
            // play the radio
            controller.play.call(this);
        },
        'MKSongIntent': function () {
            // play the radio
            controller.play.call(this, 'Mary Kate');
        },
        'JacobSongIntent': function () {
            // play the radio
            controller.play.call(this, 'Jacob');
        },
        'AMAZON.NextIntent': function () {
            this.emit(':responseReady');
        },
        'AMAZON.PreviousIntent': function () {
            this.emit(':responseReady');
        },

        'AMAZON.PauseIntent':   function () { this.emit('AMAZON.StopIntent'); },
        'AMAZON.CancelIntent':  function () { this.emit('AMAZON.StopIntent'); },
        'AMAZON.StopIntent':    function () { controller.stop.call(this) },

        'AMAZON.ResumeIntent':  function () { controller.play.call(this) },

        'AMAZON.LoopOnIntent':     function () { this.emit('AMAZON.StartOverIntent');},
        'AMAZON.LoopOffIntent':    function () { this.emit('AMAZON.StartOverIntent');},
        'AMAZON.ShuffleOnIntent':  function () { this.emit('AMAZON.StartOverIntent');},
        'AMAZON.ShuffleOffIntent': function () { this.emit('AMAZON.StartOverIntent');},
        'AMAZON.StartOverIntent':  function () {
            this.emit(':responseReady');
        },

        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued':  function () { controller.play.call(this) },
        'PauseCommandIssued': function () { controller.stop.call(this) }
    },
    audioEventHandlers: {
        'PlaybackStarted' : function () {
            /*
             * AudioPlayer.PlaybackStarted Directive received.
             * Confirming that requested audio file began playing.
             * Do not send any specific response.
             */
            console.log("Playback started");
            this.emit(':responseReady');
        },
        'PlaybackFinished' : function () {
            /*
             * AudioPlayer.PlaybackFinished Directive received.
             * Confirming that audio file completed playing.
             * Do not send any specific response.
             */
            console.log("Playback finished");
            this.emit(':responseReady');
        },
        'PlaybackStopped' : function () {
            /*
             * AudioPlayer.PlaybackStopped Directive received.
             * Confirming that audio file stopped playing.
             */
            console.log("Playback stopped");

            //do not return a response, as per https://developer.amazon.com/docs/custom-skills/audioplayer-interface-reference.html#playbackstopped
            this.emit(':responseReady');
        },
        'PlaybackNearlyFinished' : function () {
            /*
             * AudioPlayer.PlaybackNearlyFinished Directive received.
             * Replacing queue with the URL again.
             * This should not happen on live streams
             */
            console.log("Playback nearly finished");
            //this.response.audioPlayerPlay('REPLACE_ALL', audioData.url, audioData.url, null, 0);
            this.emit(':responseReady');
        },
        'PlaybackFailed' : function () {
            /*
             * AudioPlayer.PlaybackFailed Directive received.
             * Logging the error and restarting playing.
             */
            console.log("Playback Failed : %j", this.event.request.error);
            this.response.audioPlayerClearQueue('CLEAR_ENQUEUED');
            this.emit(':responseReady');
        }
    }
};

module.exports = handlers;