//The MIT License
//
//Copyright (c) 2018 Athanasios Andreou, <andreou@eurecom.fr>
//
//Permission is hereby granted, free of charge, 
//to any person obtaining a copy of this software and 
//associated documentation files (the "Software"), to 
//deal in the Software without restriction, including 
//without limitation the rights to use, copy, modify, 
//merge, publish, distribute, sublicense, and/or sell 
//copies of the Software, and to permit persons to whom 
//the Software is furnished to do so, 
//subject to the following conditions:
//
//The above copyright notice and this permission notice 
//shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
//OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
//IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR 
//ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
//TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
//SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

//if the UI breaks, then consider using the webNavigation API

//interval  sets how often a the content script will be searching for ads
var INTERVAL = 5000;

//*********VARIABLES TO PUT IN THE MESSAGES COMMUNICATING WITH THE BACKGROUND SCRIPT*********************
var MSG_TYPE = 'message_type';
var FRONTADINFO = 'front_ad_info';
var SIDEADINFO = 'side_ad_info'
var GET_SPONSORED_TEXTS = 'get_sponsored_texts';
var UPDATE_NUMBER_OF_SURVEYS = "update_number_surveys";
//*******************************************************************************************************

let timeUsingAdBlock = undefined;
let timeNotUsingAdBlock = undefined;


var sideAds= {};



// var TOPURL = '';
// 



// QUEEUE OF FRONT ADS THAT ARE CAPTURED. AFTERWARDS THE SCRIPT WILL HOVER OVER THEIR BUTTON IN ORDER TO RETRIEVE THE MORE BUTTON PARAMETERS (INCLUDING THE AD ID)
var FRONTADQUEUE= {};

//PREABLE OF THE URL THAT FETCHES EXPLANATIONS
// var EXPLANATIONSURL = 'https://www.facebook.com/ads/preferences/dialog/?'; (DEPRECATED)
var EXPLANATIONSURL = 'https://www.facebook.com/waist_content/dialog/?'


//*********************** ASYNCPARAMETERS THAT BRING 
var ASYNCPARAMS = {};
var SECOND_ASYNCPARAMS = {};

var ASYNCPARAMSGET = {};

function updateAsyncParams() {
    data = {asyncParams:true}
    window.postMessage(data,"*")
}


if ((window.location.href.indexOf('facebook.com/ads/manager')>-1) || (window.location.href.indexOf('facebook.com/adsmanager')>-1)) {
    console.log('exiting script...')
    throw new Error("Ads Manager");
}

if ((window.location.href.indexOf('www.facebook.com/ads/library/')>-1) ) {
    console.log('exiting script...')
    throw new Error("Ads Library");
}


if ((window.location.href.indexOf('facebook.com/ds/preferences')>-1) || (window.location.href.indexOf('facebook.com/ads/preferences')>-1)) {
    console.log('exiting script...')
    throw new Error("Ads Preference Page");
}



function injectAdGrabberScripts() {
    var s = document.createElement("script");
    s.src = chrome.extension.getURL("injections/adsNewInterface.js");
    (document.head||document.documentElement).appendChild(s);


    var s1 = document.createElement("script");
    s1.src = chrome.extension.getURL("injections/xhrOverloadButtons.js");
    (document.head || document.documentElement).appendChild(s1);

}


function addToFrontAdQueue(ad) {
    if (Object.keys(FRONTADQUEUE).length<=0) {
        FRONTADQUEUE[0] = ad;
        addEventListeners(ad);
        MouseTrack(ad);
        return true
    }
    var nextNum = Math.max.apply(null,Object.keys(FRONTADQUEUE).map(function (x) {return parseInt(x)})) +1
    FRONTADQUEUE[nextNum] = ad;
    addEventListeners(ad);
    MouseTrack(ad);
    return true;

}



function getAdFromButton(qId,buttonId) {

    for (let i in FRONTADQUEUE) {
        if ((FRONTADQUEUE[i].buttonId===buttonId)) {
            var ad = FRONTADQUEUE[i];
            return ad;
        }
    }
    return NaN
}


function getAdFromCustomAdanalystId(customAdAnalystId) {
    for (let i in FRONTADQUEUE) {
        if ((FRONTADQUEUE[i].adanalyst_ad_id===customAdAnalystId)) {
            var ad = FRONTADQUEUE[i];
            return ad;
        }
    }
    return NaN
}

function assignProcessingSign(sideAd) {
    sideAd.style.opacity = 0;
}

function toggleOpacity(elem) {
    if (elem.style.opacity=="0") {
        elem.style.opacity = 1;
        return;
    }f
    elem.style.opacity=0;
}



function clickOnMenusAd(adId,sideAd,adData) {
//    sideAds[adId] = sideAd;

    console.log('Processing ' + adId);

    var menus = get_dropdown_ad_menus(sideAd[DOM_AD]);
    if (menus.length===0) {
        console.log("Couldn't grab menu for ");
        console.log(sideAd);
        sideAd[DOM_AD].classList.remove(COLLECTED);
        return
    }
    var menu = menus[0];
    menu.click();
    menu.click();


    var ads = getAds(sideAd[DOM_AD]);
    var counter = 0;
    var MAX_TIME = 10;
    function checkFlag(sideAd) {
        if  (Object.keys(ads).length==0) {
            if (counter<MAX_TIME) {
                counter++;
                menu.click();
                menu.click()
//                    console.log('Trying to grab ads again...');
                ads = getAds(sideAd[DOM_AD]);
                window.setTimeout(checkFlag, 100,sideAd); /* this checks the flag every 100 milliseconds*/
                return
            }
            else  {

                console.log('Problem with ad');
                console.log(sideAd);
                sideAd[DOM_AD].classList.remove(COLLECTED);

                return
            }

        } else {


            var adToClick= ads[adId];
            chrome.runtime.sendMessage(adData, function(response) {
                console.log(response.saved);
                console.log(response)

                if (response.saved!==true) {
                    console.log('Problem with SideAd');
                    sideAd[DOM_AD].classList.remove(COLLECTED);


                    return
                }

                if (response.click) {
                    console.log('Clicking');
                    console.log(adToClick)
                    adToClick.click()
                }

            })

        }

    }
    checkFlag(sideAd);

}


function getExplanationUrlFrontAds(frontAd,adData) {
//    sideAds[adId] = sideAd;

    console.log('Processing frontAd' );
//        hide element
//        toggleOpacity(sideAd);
//        get menu
    var buttonId = getButtonId(frontAd)

//        var params = require('getAsyncParams')();
    adData.buttonId = buttonId;
//        adData.requestParams = params;
    addToFrontAdQueue(adData);
    hoverOverButton(frontAd);
    return true;

}


function notifyOverloadForMoreAdInfo(adData) {
//    sideAds[adId] = sideAd;

    console.log('Processing frontAd' );
//        hide element
//        toggleOpacity(sideAd);
//        get menu
//        adData.requestParams = params;
//
//                    data = {grabAdvertisers:true}
//                    connsole
//
//
    window.postMessage({grabNewInterface:true,customId:adData.adanalyst_ad_id},"*")
    addToFrontAdQueue(adData);
    // NOT DONE
    return true;

}


/**
 * Grabs front Ads periodically
 *
 *
 * @return {}
 */
function grabFeedAds() {
    if (window.location.href.indexOf('ads/preferences') == -1) {
        console.log('Grabbing front ads...')
        var frontAds = captureErrorContentScript(getFeedAdFrames, [], []);
        for (let i = 0; i < frontAds.length; i++) {
            let adData = captureErrorContentScript(processFeedAd, [frontAds[i]], {});
            if (isEqual(adData, {}) == true) {
                continue;
            }
            //    if (adData['visible']) {
            frontAds[i].className += " " + COLLECTED;
            adData[MSG_TYPE] = FRONTADINFO;
            captureErrorContentScript(getExplanationUrlFrontAds, [frontAds[i], adData], undefined);
            //   }
        }
    }
}


/**
 * Grabs front Ads periodically
 *
 *
 * @return {}
 */
function grabFeedAdsNewInterface() {
    if (window.location.href.indexOf('ads/preferences')==-1) {
        console.log('Grabbing front ads...')
        var frontAds = captureErrorContentScript(getFeedAdFrames,[getParentAdDivNewInterface],[]);
        for (let i=0;i<frontAds.length;i++) {
            let adData = captureErrorContentScript(processFeedAdNewInterface,[frontAds[i]],{});
            if (isEqual(adData,{})==true) {
                continue;
            }
            //      if (adData['visible']) {
            frontAds[i].className += " " + COLLECTED;
            adData[MSG_TYPE] = FRONTADINFO;
            captureErrorContentScript(notifyOverloadForMoreAdInfo,[adData],undefined);
            //      }
        }
    }

}

/**
 * @param  {object} adData The object that should be sent to the background script
 * @param  {object} paramsFinal parameters from the more button to call the explanation URL
 * @param  {string} adId the id of the associated ad
 * @param  {asyncParameters} the async paramaters generated by Facebook for GET and POST requests
 * @return {boolean} if call was successful returns true, else false
 */
function getSideAdExplanationUrlAndNotifyBackgroundScript(adData,paramsFinal,adId,asyncParametersDialog){
    var xmlhttp = new XMLHttpRequest();
    console.log(1)
    xmlhttp.open("POST",'https://www.facebook.com/ajax/a.php?', true);



    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xmlhttp.onload = function(e) {
        console.log('performing a php request');
        // Do whatever with response
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200){
            // LALA = xmlhttp.response;
            var results = captureErrorContentScript(grabParamsFromSideAdAjaxify,[xmlhttp.response],NaN);

            if (!results) {
                console.log("Couldn't grab...");
                console.log(resp);
                return false;
            }

            adData.explanationUrl = EXPLANATIONSURL + results.requestParams + '&' + $.param(asyncParametersDialog);
            adData.clientToken = results.clientToken;
            chrome.runtime.sendMessage(adData);
            // console.log(adData);
            return true;
        }
        //TODO: SEND SOME ERROR ABOUT SIDEADS

    }

    console.log("almost performed request")
    // TODO: PUT THE PARAMETERS IN SPECIFIC ORDER
    xmlhttp.send($.param(paramsFinal));


}
/**
 * Collect the explanation url from the ads and then send the adData to the background script
 *
 * @param  {object} adData. Data to be sent to the AdAnalyst server
 * @param  {object} sideAds All side ad objects thtat were detected
 * @param  {string} adId The ad id of the ad detected
 * @return {}
 */
function sendSideAdWithExplanationnUrl(adData,sideAds,adId) {


    adData[MSG_TYPE] = SIDEADINFO;
    // console.log(adData)
    var sideAd = sideAds[adId];
    var menus =  get_dropdown_ad_menus(sideAd[DOM_AD]);
    var link = menus[0].getAttribute('ajaxify')
    var urlAj = '/ajax/a.php?'
    var pars = createObjFromURI(link.replace(urlAj,''));
    var paramsFinal = Object.assign(pars,ASYNCPARAMS)
    paramsFinal['nctr[_mod]']='pagelet_ego_pane';
    var asyncParametersDialog = ASYNCPARAMSGET;
    // var asyncParametersGraphQL = SECOND_ASYNCPARAMS;
    // console.log(adData)

    adData.graphQLAsyncParams = SECOND_ASYNCPARAMS;
    // console.log(adData)
    console.log('parameters ready');
    captureErrorContentScript(updateAsyncParams,[],undefined);
    console.log('updating asynnc paramse')
    captureErrorContentScript(getSideAdExplanationUrlAndNotifyBackgroundScript,[adData,paramsFinal,adId,asyncParametersDialog],undefined);

    console.log('usideads ok')



}



/** Grab side Ads
 *
 *
 * @return {}
 */
function grabSideAds() {

    if ((Object.keys(ASYNCPARAMS).length<=0) || (Object.keys(SECOND_ASYNCPARAMS).length<=0) || (Object.keys(ASYNCPARAMSGET).length<=0)) {

        captureErrorContentScript(updateAsyncParams,[],undefined);
        console.log("need to update asyncparams...");
        setTimeout(grabAllAds, INTERVAL);
        return;

    }
    if (window.location.href.indexOf('ads/preferences')==-1) {
        sideAds = captureErrorContentScript(getSideAds,[],{});



        var noNewAds = Object.keys(sideAds).length;

        if (noNewAds>0) {

            let adsToProcessKeys =Object.keys(sideAds);
            for (var i=0; i<adsToProcessKeys.length;i++) {
                let adId = adsToProcessKeys[i];
                console.log('Processing sideAd'+ adId);


                let adData = captureErrorContentScript(processSideAd,[sideAds[adId],adId],{});
                if (isEqual(adData,{})==true) {
                    continue
                }


                captureErrorContentScript(sendSideAdWithExplanationnUrl,[adData,sideAds,adId],{});





            }

        }
    }

    // setTimeout(grabAds, INTERVAL);

}



function grabAllAds(){
    let facebookInterfaceVersion = getFacebookInterfaceVersionFromParsedDoc(document);
    if (facebookInterfaceVersion=== INTERFACE_VERSIONS.old) {
        console.log("OLD FACEBOOK INTERFACE VERSION");
        captureErrorContentScript(grabSideAds,[],{});
        captureErrorContentScript(grabFeedAds,[],{});
    } else if (facebookInterfaceVersion=== INTERFACE_VERSIONS.new) {
        console.log("NEW FACEBOOK INTERFACE VERSION");
        captureErrorContentScript(grabFeedAdsNewInterface,[],{});
    }
    setTimeout(grabAllAds, INTERVAL);

}


function permissionToGrab() {
    console.log('start');
    msg = {}
    msg[MSG_TYPE]='consent'
    chrome.runtime.sendMessage(msg,function(response) {
        if (response.consent){
            console.log('Consent exists, start collecting data');
            captureErrorContentScript(grabAllAds, [], {});
            captureErrorContentScript(grabNewsPosts, [], {});
            captureErrorContentScript(checkAdVisibleDuration, [], {});
            captureErrorContentScript(grabPosts, [], {});
            captureErrorContentScript(checkPostVisibleDuration, [],{});
            captureErrorContentScript(onFbMessaging, [], {});

            // $(window).scrollEnd(function () {
            //     console.log('Scrolling end... ');
            //     captureErrorContentScript(grabAllAds,[],{});
            //     captureErrorContentScript(grabNewsPosts, [], {});
            //     captureErrorContentScript(checkAdVisibleDuration, [], {});
            //     captureErrorContentScript(grabPosts, [], {});
            //     captureErrorContentScript(checkPostVisibleDuration, [],{});
            // }, 500);

            // window.addEventListener('scroll', function (e) {
            //     var speed = checkScrollSpeed();
            //     if ((speed > 0 && speed <= 10) || (speed >= -1 && speed < 0)) {
            //         captureErrorContentScript(grabAllAds, [], {});
            //         captureErrorContentScript(grabNewsPosts, [], {});
            //         captureErrorContentScript(checkAdVisibleDuration, [], {});
            //         captureErrorContentScript(grabPosts, [], {});
            //         captureErrorContentScript(checkPostVisibleDuration, [], {});
            //     }
            // });
            return true
        }
        else {
            setTimeout(permissionToGrab, INTERVAL);
        }
    })
}


function update_sponsored_text(){
    console.log('Executing in update_sponsored_text()....')
    let msg = {};
    msg[MSG_TYPE] = GET_SPONSORED_TEXTS;
    chrome.runtime.sendMessage(msg, function(response) {
        console.log(response);
        if (response['Status'] === "Error" ){
            setTimeout(captureErrorContentScript,1500, update_sponsored_text,[],{});
            return;
        }

        if(response['SponsoredTexts'] !== undefined){
            let lstSponsoredText = response['SponsoredTexts'].split(',')
            lstSponsoredText = lstSponsoredText.concat(SPONSORED);
            SPONSORED =  [...new Set(lstSponsoredText)];
        }

        if(response['QuestionTexts'] !== undefined){
            let lstQuestionText = response['QuestionTexts'].split(',')
            lstQuestionText = lstQuestionText.concat(EXPLANATION_TEXT)
            EXPLANATION_TEXT = [...new Set(lstQuestionText)]
        }

        if(response['StoryTexts'] !== undefined){
            let lstStoryText = response['StoryTexts'].split(',')
            lstStoryText = lstStoryText.concat(MORE_LINK_FRONT_LABEL)
            MORE_LINK_FRONT_LABEL = [...new Set(lstStoryText)]
        }
    });
}



$(document).ready(function() {
    const updateNumberOfSurveyData = {
        'user_id': getUserId() //getUserId()
    };
    updateNumberOfSurveyData[MSG_TYPE] = UPDATE_NUMBER_OF_SURVEYS;
    chrome.runtime.sendMessage(updateNumberOfSurveyData);
    setTimeout(captureErrorContentScript,500, update_sponsored_text,[],{});
    setTimeout(captureErrorContentScript, 3000,permissionToGrab,[],{});
});


window.addEventListener("message", function(event) {
    // We only accept messages from ourselves

    if (event.source != window)
        return;

    if (event.data.asyncParamsReady) {

        ASYNCPARAMS = event.data.paramsPost;
        ASYNCPARAMSGET = event.data.paramsGet;

        SECOND_ASYNCPARAMS = event.data.paramsPostSecond;
    }

    if (event.data.newInterface) {
        console.log('Data from new interface received');
        console.log(event.data);
        var customId = event.data.customId;
        var adData = getAdFromCustomAdanalystId(customId);
        adData.advertiser_facebook_id = event.data.advertiser_facebook_id;
        adData.advertiser_facebook_page = event.data.advertiser_facebook_page;
        adData.advertiser_facebook_profile_pic = event.data.advertiser_facebook_profile_pic;
        adData.clientToken = event.data.clientToken;
        adData.fb_id = event.data.adId;
        adData.graphQLAsyncParams = event.data.graphQLAsyncParams;
        adData.newInterface = event.data.newInterface;
        adData.objId = event.data.objId;
        adData.serialized_frtp_identifiers = event.data.serialized_frtp_identifiers;
        adData.story_debug_info = event.data.story_debug_info;
        adData.images = event.data.images;
        adData.video = event.data.video;

        // console.log(adData)
        chrome.runtime.sendMessage(adData, function(response) {
            adData['saved'] = response['saved'];
            adData['dbId'] = response['dbId'];
            if(response['saved'] === true){
                adData['raw_ad'] = '';
            }
        });
        return;
    }

    if (event.data.adButton)    {
        console.log('Data received');
        console.log(event.data)
        var qId = event.data.qId;
        var buttonId = event.data.buttonId
        var adData = getAdFromButton(qId,buttonId);
        adData.fb_id = event.data.adId;
        adData.explanationUrl = EXPLANATIONSURL + event.data.requestParams + '&' + $.param(event.data.asyncParams);

        adData.graphQLAsyncParams = event.data.graphQLAsyncParams;
        adData.clientToken = event.data.clientToken;
        console.log(adData);
        chrome.runtime.sendMessage(adData, function(response) {
            adData['saved'] = response['saved'];
            adData['dbId'] = response['dbId'];
            if(response['saved'] === true){
                adData['raw_ad'] = '';
            }
        });
        return;
    }

    universalCommunicationWithInjections(event);

});


function onMessageFunction(msg,sender,sendResponse) {

    /** adgrabber specific messages */
    if (!sender.tab) {

        if (msg.type === 'showInfoPopup'){
            captureErrorContentScript(createDialog, [dialogHtml], undefined);
            return
        }

    }


    /**     global messages */
    universalOnMessageFunction(msg,sender,sendResponse);
}




captureErrorContentScript(injectUniversalScripts,[],undefined);
captureErrorContentScript(injectAdGrabberScripts,[],undefined);

captureErrorContentScript(updateAsyncParams,[],undefined);





if (BrowserDetection()=== BROWSERS.CHROME) {
    chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
            onMessageFunction(msg,sender,sendResponse)
    });
}


if (BrowserDetection()=== BROWSERS.FIREFOX) {
    browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
            onMessageFunction(msg,sender,sendResponse)
    });
}




$.fn.scrollEnd = function (callback, timeout) {
    $(this).scroll(function () {
        var $this = $(this);
        if ($this.data('scrollTimeout')) {
            clearTimeout($this.data('scrollTimeout'));
        }
        $this.data('scrollTimeout', setTimeout(callback, timeout));
    });
};
