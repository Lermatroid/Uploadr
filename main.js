function onChangeUpload() {
  $("#loadingDiv").removeClass("hidden");
  jQuery.ajax({
    type: 'POST',
    url:"/api/upload",
    data: new FormData($("#uploadForm")[0]),
    processData: false, 
    contentType: false, 
    success: function(returnval) {
        
      if(returnval.completed === "true") {
        $("#loadingDiv").addClass("hidden");
        $("#msgFromServer").html(returnval.msg);
        $("#statusFromServer").html("Upload Complete!");
        $("#statusDiv").css("display", "block");
        console.log("file upload completed");
      } else if(returnval.completed === "false") {
        $("#loadingDiv").addClass("hidden");
        $("#msgFromServer").html(returnval.msg);
        $("#statusFromServer").html("Upload Failied.");
        $("#statusDiv").css("display", "block");
        console.log("file upload failed");
      }
        
     }
});
}

function onload() {
$.get( `/api/msg`, function( data ) {
      if(data.showmsg === true) {
        $("#alertDiv").removeClass("hidden");
        $("#alertIcon").css("background-color", data.color);
        $("#alertTitle").html(data.title);
        $("#alertText").html(data.msg);
      }
});
$("#file").attr("disabled", "disabled");
var imgName = "thonk" + Math.floor((Math.random() * 4) + 1);
$("#loadingImage").attr("src", `/img/${imgName}.png`);
}

function enableBtn() {
  $("#file").removeAttr("disabled");
  $("#fileLabel").removeClass("hidden");
}