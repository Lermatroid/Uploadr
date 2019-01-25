function removePost() {
    console.log("called");
    $("#removeForm").submit(function (event) {
    /*
    $.post('/backend/admin/remove', $("#removeForm").serialize(), function (data) {
        console.log(data);
    });
    */

    jQuery.ajax({
        type: 'POST',
        url:"/backend/admin/remove",
        data: new FormData($("#removeForm")[0]),
        processData: false, 
        contentType: false, 
        success: function(returnval) {
            if (returnval.msg !== undefined) {
                alert(returnval.msg);
            } else {
                alert("An Unknown Error Has Ocurred, Please Try Again");
            }
            
         }
    });
    event.preventDefault();
  });}

  $("#alertForm").submit(function (event) {
    event.preventDefault();
    jQuery.ajax({
        type: 'POST',
        url:"/backend/admin/message",
        data: new FormData($("#alertForm")[0]),
        processData: false, 
        contentType: false, 
        success: function(returnval) {
            console.log(returnval);
         }
    });
    return false;
  });

  $("#color").change(function(){
    if($("#color").val() === "Custom") {
        $("#hexDiv").show();
    } else {
        $("#hexDiv").hide();
    }
  });

function onload() {
    $("#hexDiv").hide();
    $("#alertDiv").hide();
    $.get( `/api/msg`, function( data ) {
        console.log(data);
        if(data.showmsg === false) {
            $("#enabled").val("No");
        } else {
            if(data.color !== "Yellow" && data.color !== "Red" && data.color !== "Green") {
                $("#color").val("Custom");
                $("#alertHex").val(data.color);
                $("#hexDiv").show();
            } else if (data.color === "Green" || data.color === "Red") {
                $("#color").val(data.color);
            }
            console.log(data.title);
            if(data.title !== undefined) {
                $("#alertTitle").val(data.title);
            }
            if(data.msg !== undefined) {
                $("#alertText").val(data.msg);
            }
        }
  });
}
// $("#alertIcon").css("background-color", data.color);
function setPreview() {
    $("#alertDiv").show();
    $("#previewButton").css("margin-bottom", "30px");
    window.open("#alertDiv", "_self");
    $("#alertText_").html($("#alertText").val());
    $("#alertTitle_").html($("#alertTitle").val());
    if("Custom" === $("#color").val()) {
        $("#alertIcon").css("background-color", $("#alertHex").val());
    } else {
        $("#alertIcon").css("background-color", $("#color").val());
    }
}