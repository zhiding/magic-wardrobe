var imageBinary = "";
var imgUrl = "";
var imgSubPlane = "";
var jcrop_api, attr_jcrop;
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
var attrs_backup = new Array(10);
var attrs = new Array(10);
var img_addrs = [];

var perCount = 10;
var pageCount = 0;

// pack_info, uploadImage, submit are functions to communicate with server.

/*
pack_info:
pack up the info of type `type` to a string.
info_obj{type == 0}:
{"gender": <0/1/-1>, "style": <1~7/-1>, "area": [x1,y1,w,h], 
"imgurl": <server side url>}
info_obj{type == 1}:
{"gender": <0/1/-1>, "style": <1~7/-1>, "area": [x1,y1,w,h], 
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
	subPlaneUrl = "";
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
	$.post("../ir/ProcessServlet", {algo: "c5042", info: pack_str}, callback, "xml");
}

function callback_uploadImage(result) {
    // The server is not always on, thus I add this when testing.
    result = "<RESULTS><RESULT>13</RESULT><RESULT>26</RESULT><RESULT>100</RESULT><RESULT>200</RESULT></RESULTS>"
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
    result = "<RESULTS><RESULT>100</RESULT><RESULT>10</RESULT><RESULT>1</RESULT><RESULT>1</RESULT> \
    <RESULT>1</RESULT><RESULT>1</RESULT><RESULT>1</RESULT><RESULT>1</RESULT> \
    <RESULT>1</RESULT><RESULT>1</RESULT><RESULT>1</RESULT><RESULT>1</RESULT><RESULT>/a.jpg</RESULT></RESULTS>"
    var tmp = [];
    $(result).find('RESULT').each(function() {
        tmp.push($(this).text());
    });
    if (tmp.length < 2 || tmp.length < 2 + parseInt(tmp[1])) alert("FATAL ERROR");
    color = color_backup = parseInt(tmp[0]);
    for (var i = 2;i < parseInt(tmp[1]);i++)
    {
        attrs[i - 2] = attrs_backup[i - 2] = parseInt(tmp[i]);
    }
    img_addrs = [];
    for (var i = 2 + parseInt(tmp[1]);i < 29;i++)
    {
        // TODO: result here
        img_addrs.push("img/" + (i - 11) + ".jpg");
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
    $(".flex-images").html("");
    for (var i = (k - 1) * perCount;i < Math.min(img_addrs.length, k * perCount);i++)
    {
        var dom = '<div class="item" data-w="320" data-h="320"><a href="' + img_addrs[i] + '" data-toggle="lightbox" data-gallery="multiimages"><img class="search-result" src="' + img_addrs[i] + '"></a></div>';
        $(".flex-images").append(dom);
    }
    $(".flex-images").flexImages({rowHeight: 140});
    $("#pages li").removeClass("active");
    $("#pages a:first").attr("data-id", (k - 1 > 0) ? k - 1 : -1);
    $("#pages a:last").attr("data-id", (k + 1 > pageCount) ? -1 : k + 1);
    $("#pages a[data-id=" + k + "]").parent().addClass("active");
}

function firstRetrieval_setAttrs() {
    // set the attributes with the `attrs`, `color` global var
    // TODO: This will be implemented after the confimation of the attributes' representation
    page_init();
    toggle_page(1);
}

function modify_attrs(k, attr) {
	// do it when you modify the tags of clothes.
	attrs[k] = attr;
	if (attr_backup[k] != attr) attrs[k] = -attrs[k];
}

function modify_hue(hue) {
	// maybe we need some codes here to transform RGB to HSV?
	window.color = hue;
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
	var info_obj = {imgurl: imgUrl, gender: gender, style: style, area: jcrop_api.tellSelect(), attr: attrs,
			hue: (color == color_backup) ? -1 : color, subPlaneUrl: subPlaneUrl, 
			img_replace_area: attr_areas[0], sub_replace_area: attr_areas[1]};
	submit(1, info_obj, callback_secondRetrieval);
}

function callback_secondRetrieval(result) {
	// TODO: Just show the imgaddrs to the user!
}