'use strict';

var Kifu = require("Kifu");

function showNotification(message) {
    console.log(message);
    if (message) {
        $('#notification').text(message);
        $('#notification').show();
    }
}

function showSourceInput() {
    $('#source-input').show();
    $('#viewer').hide();
    $('#admin').show();
}

function showBoard(able_to_save) {
    $('#viewer').show();
    $('#source-input').hide();
    if (able_to_save) {
        $('#save-panel').show();
    } else {
        $('#save-panel').hide();
    }
    $('#admin').hide();
}

function initKifuWithString(kifu_string, able_to_save) {
    console.log("initKifuWithString()");
    Kifu.settings={ImageDirectoryPath: "Kifu-for-JS/images"};
    $('#board').empty();
    Kifu.loadString(kifu_string, "board");
    console.log("先手: " + getSenteName());
    console.log("後手: " + getGoteName());
    showBoard(able_to_save);
}

function getEncodingFromFileName(filename){
    var tmp = filename.split("."), ext = tmp[tmp.length-1];
    return ["jkf", "kifu", "ki2u"].indexOf(ext) >=0 ? "UTF-8" : "Shift_JIS";
}

function handleFileSelect(evt) {
    var file = evt.target.files[0];
    console.log("Reading \"" + file.name + "\"");
    var reader = new FileReader();
    var encoding = getEncodingFromFileName(file.name);
    reader.onload = function(){
        var kifu_text = reader.result;
        $('#meta-kifu').val(kifu_text);
        initKifuWithString(kifu_text, true);
    };
    reader.readAsText(file, encoding);
}

function handleSWars(url) {
    console.log("Using url \"" + url + "\" as is");
    $.get(url, function(html) {
        var csa = convertSWarToCsa(html);
        if (csa) {
            console.log(csa);
            $('#meta-kifu').val(csa);
            initKifuWithString(csa, true);
        } else {
            showNotification("Failed to parse SWar HTML");
        }
    });
}


// http://shogiwars.heroz.jp:3002/games/torororo2-54769876-20151017_192415
function convertSWarToCsa(html) {
    var result;
    result = html.match(/receiveMove\("(.+?)"\)/);
    // 棋譜本体が得られないことには話は始まらないので、エラーとする。
    if (!result) {
        return null;
    }
    // GOTE_WIN_TORYO
    // SENTE_WIN_TIMEOUT
    var kifu_content = result[1]
        .replace(/\t|,/g, "\n")
        .replace(/^.+TIMEOUT$/m, "%TIMEOUT")
        .replace(/^.+TORYO$/m, "%TORYO")
        .split("\n");
    var time_limit = null;
    var sente_remaining = null;
    var gote_remaining = null;
    var kifu_str = "";
    for (var i = 0; i < kifu_content.length; i++) {
        var line = null;
        if (i == 1) { // 最初のL値
            // L600 ... 10分
            if (kifu_content[i] == "L600") {
                time_limit = 600;
                sente_remaining = 600;
                gote_remaining = 600;
            } else if (kifu_content[i] == "L180") {
                // L180 ... 弾丸(3分)
                time_limit = 180;
                sente_remaining = 180;
                gote_remaining = 180;
            } else if (kifu_content[i].match(/L35\d{2}/)) {
                console.log("10秒戦");
            } else {
                console.log("不明な時間フォーマット (" + kifu_content[i] + ")");
            }
        }

        if (i%2 == 1) {
            if (time_limit) {
                var next_remaining = parseInt(kifu_content[i].substr(1))
                if (i%4 == 1) {
                    line = "T" + (sente_remaining - next_remaining);
                    sente_remaining = next_remaining;
                } else {
                    line = "T" + (gote_remaining - next_remaining);
                    gote_remaining = next_remaining;
                }
            }
        } else {
            line = kifu_content[i];
        }
        if (line) {
            kifu_str += line + "\n";
        }
    }
    var result2 = html.match(/<title>.+\((.+)対(.+)\)<\/title>/);
    var sente_name = "名無しの先手";
    var gote_name = "名無しの後手";
    console.log("hoge: " + result2);
    if (result2) {
        sente_name = result2[1];
        gote_name = result2[2];
    }
    var csa = "V2.2\n"
    csa += "N+" + sente_name + "\n";
    csa += "N-" + gote_name + "\n";
    if (time_limit) {
        var mm = ("00" + (time_limit / 60)).substr(-2);
        // 切れ負けなので+00
        var line = "$TIME_LIMIT:00:" + mm + "+00\n";
        csa += line;
    }
    csa += "P1-KY-KE-GI-KI-OU-KI-GI-KE-KY\n";
    csa += "P2 * -HI *  *  *  *  * -KA * \n";
    csa += "P3-FU-FU-FU-FU-FU-FU-FU-FU-FU\n";
    csa += "P4 *  *  *  *  *  *  *  *  * \n";
    csa += "P5 *  *  *  *  *  *  *  *  * \n";
    csa += "P6 *  *  *  *  *  *  *  *  * \n";
    csa += "P7+FU+FU+FU+FU+FU+FU+FU+FU+FU\n";
    csa += "P8 * +KA *  *  *  *  * +HI * \n";
    csa += "P9+KY+KE+GI+KI+OU+KI+GI+KE+KY\n";
    csa += "+\n";
    csa += kifu_str;
    return csa;
}

function handleKifuDatabase(url) {
    console.log("using url \"" + url + "\"");
    $.get(url, function(data) {
        var kifu_text = $('textarea[name=data]', $.parseHTML(data)).text();
        if (kifu_text.trim() == "") {
            console.log("empty kifu data");
        } else {
            $('#meta-kifu').val(kifu_text);
            initKifuWithString(kifu_text, true);
        }
    });
}

// http://stackoverflow.com/questions/901115/
function getParameterByName(uri, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var queryString = uri.substring(uri.indexOf('?') + 1);
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(queryString);
    return results === null ? "" : decodeURIComponent(
        results[1].replace(/\+/g, " "));
}

function handleDownloadClick(event) {
    var ext_source = $('#ext-source').val().trim();
    var url;
    if (/^http:\/\/shogiwars.heroz.jp:3002/.test(ext_source)) {
        handleSWars(ext_source);
    } else if (/^http:\/\/kifudatabase.no-ip.org\/shogi/.test(ext_source)) {
        var kid = getParameterByName(ext_source, 'kid');
        console.log("kid: " + kid);
        url = 'http://kifdatabase.no-ip.org/shogi/index.php'
            + '?cmd=kif&cmds=displaytxt&kid=' + kid;
        handleKifuDatabase(url);
    } else if (/\d+/.test(ext_source)) {
        url = 'http://kifdatabase.no-ip.org/shogi/index.php'
            + '?cmd=kif&cmds=displaytxt&kid=' + ext_source;
        handleKifuDatabase(url);
    } else {
        showNotification("Unknown format \"" + kifu_id + "\"");
    }
}

function handleSaveClick(event) {
    console.log("save clicked");
    var kifu_title = $('#meta-title').val();
    var kifu_text = $('#meta-kifu').val();
    var last_kifu_id = parseInt(localStorage.last_kifu_id);
    var next_kifu_id = last_kifu_id + 1;
    localStorage.last_kifu_id = next_kifu_id;
    var kifu_hash = JSON.parse(localStorage.kifu_hash);
    var kifu_info = {
        id: next_kifu_id,
        title: kifu_title,
        kifu_text: kifu_text
    };
    console.log(kifu_info);
    kifu_hash[next_kifu_id] = kifu_info;
    console.log(JSON.stringify(kifu_hash));
    localStorage.kifu_hash = JSON.stringify(kifu_hash);
}

function handleClearClick(event) {
    console.log("clear clicked");
    localStorage.clear();
    initStorage();
}

function handleBackClick(event) {
    console.log("back clicked");
    showSourceInput();
}

function initStorage() {
    if (localStorage.last_kifu_id == null) {
        console.log("Initializing last_kifu_id");
        localStorage.last_kifu_id = 0;
    }
    if (localStorage.kifu_hash == null) {
        console.log("Initializing kifu_hash");
        localStorage.kifu_hash = JSON.stringify({});
    }
    console.log("Current last_kifu_id: "
                + localStorage.last_kifu_id);
    var kifu_hash = JSON.parse(localStorage.kifu_hash);
    console.log("Current kifu_hash size: "
                + Object.keys(kifu_hash).length);
    console.log("total localStorage length: "
                + localStorage.length);
    var keys = Object.keys(kifu_hash);
    if (keys.length == 0) {
        $('#saved-kifus').append("(empty)");
    } else {
        var ul_item = $(document.createElement("ul"));
        for (var i = 0; i < keys.length; i++) {
            var kifu_info = kifu_hash[keys[i]];
            console.log(JSON.stringify(kifu_info));
            var li_item = $(document.createElement("li"));
            var a_item = $(document.createElement("a"));
            (function (kifu_info) {
                console.log("setting " + kifu_info.title);
                a_item.click(function () {
                    console.log("Opening \"" + kifu_info.title + "\"");
                    var kifu_text = kifu_info.kifu_text;
                    console.log(kifu_text);
                    // 保存済テキスト
                    initKifuWithString(kifu_text, false);
                });
            })(kifu_info);
            a_item.attr("href", "#");
            a_item.text(kifu_info.title);
            li_item.append(a_item);
            ul_item.append(li_item);
        }
        $('#saved-kifus').append(ul_item);
    }
}

function main() {
    document.getElementById('files').addEventListener(
        'change', handleFileSelect, false);
    document.getElementById('download').addEventListener(
        'click', handleDownloadClick, false);
    document.getElementById('back').addEventListener(
            'click', handleBackClick, false);
    if (typeof localStorage !== 'undefined') {
        document.getElementById('save-button').addEventListener(
            'click', handleSaveClick, false);
        document.getElementById('clear').addEventListener(
            'click', handleClearClick, false);
        initStorage();
    } else {
        $('#save-panel').hide();
        $('#clear').hide();
    }
}
main();
