function onChangeUpload() {
  jQuery.ajax({
    type: 'POST',
    url:"/api/upload",
    data: new FormData($("#uploadForm")[0]),
    processData: false, 
    contentType: false, 
    success: function(returnval) {
        
      if(returnval.completed === "true") {

        $("#msgFromServer").html(returnval.msg);
        $("#statusDiv").css("display", "block");
        console.log("file upload completed");
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
}