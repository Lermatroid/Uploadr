function onload() {

    var path = window.location.href;
    var isIncorrect = path.split("?")[1];
    console.log(isIncorrect);
    console.log(path.split("?"));
    if(isIncorrect === null || isIncorrect === undefined) {
        $("#incorrect").css("display", "none");
    } else {
        $("#incorrect").css("display", "block");
    }



}

function postCreate() {

    $("#loginForm").submit(function (event) {
    $.post('/backend/admin/login', $("#loginForm").serialize(), function (data) {
        console.log(data);
        var serverr = data;
        console.log(serverr["valid"]);
        if(serverr["valid"] === false) {

         $(".modal-title").html("Login Failed:");
         $(".modal-body").html(serverr.reason);
         $("#actionbutton").attr("onClick", "location.reload();");
         $("#alertmodal").modal({backdrop: 'static', keyboard: false});
        } else if(serverr["valid"] === true) {
            console.log("ran");
           Cookies.set('uploadr_admin_session', serverr.sessionid, { expires: 30 });
           Cookies.set('uploadr_admin_id', serverr.uploadradmin, { expires: 30 });
           location.reload();
        } else {
            
         $(".modal-title").html("Error:");
         $(".modal-body").html("An Unknown Error Has Ocourred, Please Try Again");
         $("#actionbutton").attr("onClick", "location.reload();");
         $("#alertmodal").modal({backdrop: 'static', keyboard: false});
        } 
    });
    event.preventDefault();
  });}