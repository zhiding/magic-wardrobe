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
var attr_str = "";
var color = 0;
var color_backup = 0;
var attrs_backup = new Array(10);
var attrs = new Array(10);

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
	$.post("../ir/ProcessServlet", {algo: "c5042", info: pack_str}, callback);
}

function callback_uploadImage(result) {
	// TODO: As the server side code is yet to be implemented, this part will be reimplemented after the 1st command finished.
	// jcrop_api.setSelect();
	// window.area = ...
}

// After you modify the region of the query image, you can click on a button, and ...
function firstRetrieval() {
	var info_obj = {imgurl: imgUrl, gender: gender, style: style, area: jcrop_api.tellSelect()};
	submit(0, info_obj, callback_firstRetrieval);
}

function callback_firstRetrieval(result) {
	// TODO: Give color, attrs, imgaddrs to client.
	// color = ...; color_backup = ...;
	// attrs = ...; attr_backup = ...;
	// set color, attrs in front-end, and show images too.
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