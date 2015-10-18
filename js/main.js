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
}

function showBoard() {
    $('#viewer').show();
    $('#source-input').hide();
}

function initKifuWithString(kifu_string) {
    console.log("initKifuWithString()");
    Kifu.settings={ImageDirectoryPath: "Kifu-for-JS/images"};
    $('#board').empty();
    Kifu.loadString(kifu_string, "board");
    console.log("先手: " + getSenteName());
    console.log("後手: " + getGoteName());
    showBoard();
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
        initKifuWithString(reader.result);
    };
    reader.readAsText(file, encoding);
}

function handleSWars(url) {
    console.log("Using url \"" + url + "\" as is");
    $.get(url, function(html) {
        var csa = convertSWarToCsa(html);
        if (csa) {
            console.log(csa);
            $('#meta-kifu').text(csa);
            initKifuWithString(csa);
        } else {
            showNoticification("Failed to parse SWar HTML");
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
        var kifu = $('textarea[name=data]', $.parseHTML(data)).text();
        if (kifu.trim() == "") {
            console.log("empty kifu data");
        } else {
            $('#meta-kifu').text(kifu);
            initKifuWithString(kifu);
        }
    });
}

function handleDownloadClick(event) {
    var ext_source = $('#ext-source').val().trim();
    if (/^http:\/\/shogiwars.heroz.jp:3002/.test(ext_source)) {
        handleSWars(ext_source);
    } else if (/^http:\/\/kifudatabase.no-ip.org/.test(ext_source)) {
        handleKifuDatabase();
    } else if (/\d+/.test(ext_source)) {
        var url = 'http://kifdatabase.no-ip.org/shogi/index.php'
            + '?cmd=kif&cmds=displaytxt&kid=' + ext_source;
        handleKifuDatabase(url);
    } else {
        showNotification("Unknown format \"" + kifu_id + "\"");
    }
}

function handleSaveClick(event) {
    console.log("save clicked");
    var title = $('#meta-title').text();
    var kifu = $('#meta-kifu').text();
    var last_kifu_id = parseInt(localStorage.last_kifu_id);
    var next_kifu_id = last_kifu_id + 1;
    localStorage.last_kifu_id = next_kifu_id;
    var kifu_hash = JSON.parse(localStorage.kifu_hash);
    var hash = {
        id: next_kifu_id,
        title: title,
        kifu: kifu,
    };
    console.log(hash);
    kifu_hash[next_kifu_id] = hash;
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
    var kifu_hash = JSON.parse(localStorage.kifu_hash)
    console.log("Current kifu_hash size: "
                + Object.keys(kifu_hash).length);
    console.log("total localStorage length: "
                + localStorage.length);
}

function main() {
    document.getElementById('files').addEventListener(
        'change', handleFileSelect, false);
    document.getElementById('download').addEventListener(
        'click', handleDownloadClick, false);
    document.getElementById('back').addEventListener(
        'click', handleBackClick, false);
    if (typeof localStorage !== 'undefined') {
        document.getElementById('save').addEventListener(
            'click', handleSaveClick, false);
        document.getElementById('clear').addEventListener(
            'click', handleClearClick, false);
        initStorage();
    } else {
        $('#save').hide();
        $('#clear').hide();
    }
}

main();
