function onload() {
    var path = window.location.pathname;
    var uploadID = path.split("/")[2];
    if(!!Cookies.get("f_" + uploadID)) {
        $("#saveButton").css("display", "none");
    }
    $.get(`/api/fileinfo/${uploadID}`, function( data ) {
        $("#subtitle").html(`${data.name} (${data.size}MB)`);
        $("#downloadButton").attr("href", `/api/get/${uploadID}`);
        $("#mainButton").html(`Download ${data.size}MB`);
        $("#htmltitle").html("Uploadr | " + data.name);
        $("#urlInput").val(window.location.href);

        if(data.name.split(".")[1] === "png" || data.name.split(".")[1] === "jpg" || data.name.split(".")[1] === "jpeg" || data.name.split(".")[1] === "gif") {

            $("#imageDiv").css("display", "block");
            $("#imagePreview").attr("src", `/api/get/${uploadID}`);

        }
        
        if(data.name.split(".")[1] === "mp3" || data.name.split(".")[1] === "ogg") {

            $("#musicDiv").css("display", "block");
            $("#musicSRC").attr("src", `/api/get/${uploadID}`);

            if(data.name.split(".")[1] === "mp3") {
                $("#musicSRC").attr("type", "audio/mpeg");
            }
            if(data.name.split(".")[1] === "ogg") {
                $("#musicSRC").attr("type", "audio/ogg");
            }

        }

        if(data.name.split(".")[1] === "mp4") {
            $("#videoDiv").css("display", "block");
            $("#videoSRC").attr("src", `/api/get/${uploadID}`);
            $("#videoSRC").attr("type", "video/mp4");
        }

      });

}

function saveFile() {
    var path = window.location.pathname
    var uploadID = path.split("/")[2];
if(!!Cookies.get("f_" + uploadID)) {

    console.log("cookie already exists");

} else {
    $.get( `/api/fileinfo/${uploadID}`, function( data ) {

        Cookies.set("f_" + uploadID, `{"name": "${data.name}", "fileID": "${uploadID}", "size": "${data.size}"}`);
        console.log("wrote cookie with id: " + uploadID);
        $("#saveButton").css("display", "none");
        
    });

}
}

function copyURL() {
    $("#urlInput").select();
    document.execCommand("copy");
}