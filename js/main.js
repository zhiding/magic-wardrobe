var imageBinary = "";
var imgUrl = "";
var imgSubPlane = "";
var jcrop_api, sub_upload_jcrop, sub_ori_jcrop;
var alo = 3;
var nu = 10;
var attr_areas = new Array();
attr_areas[0] = [0,0,0,0];
attr_areas[1] = [0,0,0,0];

// TODO: when users set the front-end attributes, those values should be modified.
var gender = -1;
var style = -1;
var color = 0;
var color_backup = 0;
var color_set = -1;
var attrs_backup = new Array(10);
var attrs = new Array(10);
var img_addrs = [];
var img_addrs_2 = [];

var perCount = 16;
var pageCount = 0;

// pack_info, uploadImage, submit are functions to communicate with server.

/*
pack_info:
pack up the info of type `type` to a string.
info_obj{type == 0}:
{"gender": <0/1/-1>, "style": <1~7/-1>, "area_arr": [x1,y1,w,h], 
"imgurl": <server side url>}
info_obj{type == 1}:
{"gender": <0/1/-1>, "style": <1~7/-1>, "area_arr": [x1,y1,w,h], 
"imgurl": <server side url>, "attr": [attr1,attr2,……], 
"hue": <Hue>, "subPlaneUrl": <SubPlaneUrl>, 
"img_replace_area": [x1,y1,w,h], "sub_replace_area": [x1,y1,w,h]}
info_obj{type == 2}:
{"gender": <0/1/-1>, "style": <1~7/-1>, "imgurl": <server side url>}
*/
function pack_info(type, info_obj)
{
    var info_str = null;
    switch (type)
    {
        case 1:
            var area_str = info_obj.area_arr.join(",");
            var area_replace_str = info_obj.img_replace_area.join(",");
            var sub_area_replace_str = info_obj.sub_replace_area.join(",");
            var attr_str = info_obj.attr.join(";");
            info_str = type + ";" + info_obj.gender + ";" + 
                info_obj.style + ";" + area_str + ";" + 
                info_obj.imgurl + ";" + alo + ";" + nu + ";" + attr_str + 
                ";" + info_obj.hue + ";" + info_obj.subPlaneUrl + ";" + 
                area_replace_str + ";" + sub_area_replace_str + ";";
            break;
        case 2:
            info_str = type + ";" + info_obj.gender + ";" + 
                info_obj.style + ";" + info_obj.imgurl + ";";
            break;
        case 0:
            var area_str = info_obj.area_arr.join(",");
            info_str = type + ";" + info_obj.gender + ";" + 
                info_obj.style + ";" + area_str + ";" + 
                info_obj.imgurl + ";" + alo + ";";
            break;
        default:
            return false;
    }
    console.log("query:", info_str);
    return info_str;
}

// After you choose an image, do readImage, uploadImage, submit, returning region.
// The callback_uploadImage will modify the jcrop region automatically. But it has 
// not been implemented as the returning type is not known now. (It is XML now.)
function regionDetection(file) {
    var reader = new FileReader();
    reader.onload = function() {
        imageBinary = this.result;
		uploadImage(imageBinary, function() {
			// TODO: gender and style
			var info_obj = {imgurl: imgUrl, gender: gender, style: style};
			submit(2, info_obj, callback_uploadImage);
		}, 0);
    }
	imgSubPlane = "";
    reader.readAsDataURL(file);
}

function uploadImage(image_binary, submit_cb, param_type) {
    
    var type = "application/upload";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
			if (param_type == 0) {
				imgUrl = xhr.responseText;
            	imgUrl = imgUrl.substr(0, imgUrl.length - 2);
			} else {
				imgSubPlane = xhr.responseText;
            	imgSubPlane = imgSubPlane.substr(0, imgSubPlane.length - 2);
			}
			if (submit_cb) submit_cb()
        }
    }
    xhr.open('POST','../ir/ImageUploading',true);
    xhr.setRequestHeader("Content-type", type);
    xhr.send(image_binary);
}

function submit(type, info_obj, callback) {
	pack_str = pack_info(type, info_obj);
	console.log("query: ../ir/ProcessServlet?algo=c5042&info=", pack_str);
	// $.post("../ir/ProcessServlet", {algo: "c5042", info: pack_str}, callback, "xml");
    $.ajax({type: "POST", url: "../ir/ProcessServlet", data: {algo: "c5042", info: pack_str}, contentType: "application/x-www-form-urlencoded;charset=utf-8", dataType: "xml", success: callback});
}

function callback_uploadImage(result) {
    // The server is not always on, thus I add this when testing.
    // result = "<RESULTS><RESULT>13</RESULT><RESULT>26</RESULT><RESULT>100</RESULT><RESULT>200</RESULT></RESULTS>"
    var region_res = [];
    $(result).find('RESULT').each(function() {
        region_res.push(parseInt($(this).text()));
    });
    console.log(region_res);
    if (region_res.length != 4) alert("FATAL ERROR");
    jcrop_api.setSelect(region_res);
}

// After you modify the region of the query image, you can click on a button, and ...
function firstRetrieval() {
    var selection = jcrop_api.getSelection();
	var info_obj = {imgurl: imgUrl, gender: gender, style: style, area_arr: [selection.x,selection.y,selection.w,selection.h]};
	submit(0, info_obj, callback_firstRetrieval);
}

function callback_firstRetrieval(result) {
    /* result = "<RESULTS><RESULT>256</RESULT><RESULT>10</RESULT><RESULT>1</RESULT><RESULT>2</RESULT> \
    <RESULT>3</RESULT><RESULT>4</RESULT><RESULT>1</RESULT><RESULT>2</RESULT> \
    <RESULT>3</RESULT><RESULT>4</RESULT><RESULT>1</RESULT><RESULT>2</RESULT><RESULT>img/1.jpg</RESULT><RESULT>200</RESULT><RESULT>100</RESULT></RESULTS>";
    */
    var tmp = [];
    $(result).find('RESULT').each(function() {
        tmp.push($(this).text());
    });
    if (tmp.length < 2 || tmp.length < 2 + parseInt(tmp[1])) alert("FATAL ERROR");
    color = color_backup = color_set = parseInt(tmp[0]);
    for (var i = 2;i < parseInt(tmp[1]) + 2;i++)
    {
        attrs[i - 2] = attrs_backup[i - 2] = parseInt(tmp[i]);
    }
    img_addrs = [];
    for (var i = 2 + parseInt(tmp[1]);i < tmp.length;i += 3)
    {
        // TODO: result here
        img_addrs.push([tmp[i], tmp[i+1], tmp[i+2]]);
    }
    firstRetrieval_setAttrs();
}

function page_init() {
    $("#pages").html("");
    pageCount = Math.ceil(img_addrs.length / perCount);
    var $page = $("<ul class='pagination'></ul>");
    $page.append("<li><a data-id='-1' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
    for (var i = 0;i < pageCount;i++)
    {
        $page.append("<li><a data-id='" + (i + 1) + "'>" + (i + 1) + "</a></li>");
    }
    $page.append("<li><a data-id='-1' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>");
    $("#pages").append($page);
}

function toggle_page(k) {
    if (k < 0) return;
    $("#image-show-1").html("");
    for (var i = (k - 1) * perCount;i < Math.min(img_addrs.length, k * perCount);i++)
    {
        var dom = '<div class="item" data-w="' + img_addrs[i][1] + '" data-h="' + img_addrs[i][1] + '"><img class="search-result" src="' + img_addrs[i][0] + '"></a></div>';
        $("#image-show-1").append(dom);
    }
    $("#image-show-1").flexImages({rowHeight: 140});
    $("#pages li").removeClass("active");
    $("#pages a:first").attr("data-id", (k - 1 > 0) ? k - 1 : -1);
    $("#pages a:last").attr("data-id", (k + 1 > pageCount) ? -1 : k + 1);
    $("#pages a[data-id=" + k + "]").parent().addClass("active");
}

function firstRetrieval_setAttrs() {
    var k = 0;
    console.log(attrs);
    $("#search select").each(function() {
        $(this).prop("disabled", true);
        $(this).val(attrs[k]);
        k++;
    });
    k = 0; 
    $("#substitute select").each(function() {
        $(this).prop("disabled", false);
        $(this).val(attrs[k]);
        k++;
    });
    var rgb = h2rgb(color);
    var color_hex = "#";
    for (var i = 0;i < 3;i++) {
        var str = rgb[i].toString(16);
        if (str.length == 1) str = "0" + str; 
        color_hex += str;
    }
    $(".colorpicker-element").colorpicker("setValue", color_hex);
    console.log("color_hex:", color_hex);
    page_init();
    toggle_page(1);
}

function rgb2h(r, g, b) {
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    var h = 0;
    if (max == min) h = 0;
    else if (max == r && g >= b) {
        h = Math.floor(60 * (g - b) / (max - min));
    }
    else if (max == r && g < b) {
        h = Math.floor(60 * (g - b) / (max - min) + 360);
    }
    else if (max == g) {
        h = Math.floor(60 * (b - r) / (max - min) + 120);
    }
    else {
        h = Math.floor(60 * (r - g) / (max - min) + 240);
    }
    return h;
}

function h2rgb(h) {
    var hi = Math.floor(h / 60) % 6;
    var f = h / 60 - hi;
    var p = 0;
    var q = parseInt((1 - f) * 255);
    var t = parseInt(f * 255);
    var v = 255;
    
    switch (hi) {
        case 0:
            return [v, t, p];
        case 1:
            return [q, v, p];
        case 2:
            return [p, v, t];
        case 3:
            return [p, q, v];
        case 4:
            return [t, p, v];
        case 5:
            return [v, p, q];
    }
}

function uploadSubPlane(file) {
	var reader = new FileReader();
    reader.onload = function() {
        var subPlaneImageBinary = this.result;
		uploadImage(subPlaneImageBinary, false, 1);
    }
    reader.readAsDataURL(file);
}

/*
{"gender": <0/1/-1>, "style": <1~7/-1>, "area": [x1,y1,w,h], 
"imgurl": <server side url>, "attr": [attr1,attr2,……], 
"hue": <Hue>, "subPlaneUrl": <SubPlaneUrl>, 
"img_replace_area": [x1,y1,w,h], "sub_replace_area": [x1,y1,w,h]}
*/
function secondRetrieval() {
    var selection = jcrop_api.getSelection();
    var selection_arr = [selection.x,selection.y,selection.w,selection.h];
    
    if (imgSubPlane != "")
    {
        var selection_a = sub_ori_jcrop.getSelection();
        attr_areas[0] = [selection_a.x,selection_a.y,selection_a.w,selection_a.h];
        selection_a = sub_upload_jcrop.getSelection();
        attr_areas[1] = [selection_a.x,selection_a.y,selection_a.w,selection_a.h];
    }
    var k = 0;
    $("#substitute select").each(function() {
        if ($(this).val() != attrs_backup[k]) attrs[k] = -$(this).val();
        k++;
    });
	var info_obj = {imgurl: imgUrl, gender: gender, style: style, area_arr: selection_arr, attr: attrs,
			hue: (color == color_backup) ? -1 : color, subPlaneUrl: imgSubPlane, 
			img_replace_area: attr_areas[0], sub_replace_area: attr_areas[1]};
	submit(1, info_obj, callback_secondRetrieval);
}

function callback_secondRetrieval(result) {
	// result = "<RESULTS><RESULT>img/2.jpg</RESULT><RESULT>200</RESULT><RESULT>100</RESULT></RESULTS>";
    var tmp = [];
    $(result).find('RESULT').each(function() {
        tmp.push($(this).text());
    });
    img_addrs_2 = [];
    for (var i = 0;i < tmp.length;i += 3)
    {
        img_addrs_2.push([tmp[i], tmp[i+1], tmp[i+2]]);
    }
    page_init_2();
    toggle_page_2(1);
}

function page_init_2() {
    $("#pages-2").html("");
    pageCount = Math.ceil(img_addrs_2.length / perCount);
    var $page = $("<ul class='pagination'></ul>");
    $page.append("<li><a data-id='-1' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
    for (var i = 0;i < pageCount;i++)
    {
        $page.append("<li><a data-id='" + (i + 1) + "'>" + (i + 1) + "</a></li>");
    }
    $page.append("<li><a data-id='-1' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>");
    $("#pages-2").append($page);
}

function toggle_page_2(k) {
    if (k < 0) return;
    $("#image-show-2").html("");
    for (var i = (k - 1) * perCount;i < Math.min(img_addrs_2.length, k * perCount);i++)
    {
        var dom = '<div class="item" data-w="' + img_addrs_2[i][1] + '" data-h="' + img_addrs_2[i][1] + '"><a href="' + img_addrs_2[i][0] + '" data-toggle="lightbox" data-gallery="multiimages"><img class="search-result" src="' + img_addrs_2[i][0] + '"></a></div>';
        $("#image-show-2").append(dom);
    }
    $("#image-show-2").flexImages({rowHeight: 140});
    $("#pages-2 li").removeClass("active");
    $("#pages-2 a:first").attr("data-id", (k - 1 > 0) ? k - 1 : -1);
    $("#pages-2 a:last").attr("data-id", (k + 1 > pageCount) ? -1 : k + 1);
    $("#pages-2 a[data-id=" + k + "]").parent().addClass("active");
}

/* Tools */
function setImgUrl(s)
{
    s = s.replace(/\/challenge_images/, "E:/DB_JD");
    s = s.replace(new RegExp(/\//, "gm"), "\\");
    imgUrl = s;
    
    // Do region detection
    var info_obj = {imgurl: imgUrl, gender: gender, style: style};
    submit(2, info_obj, callback_uploadImage);
}