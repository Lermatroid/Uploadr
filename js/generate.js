$("#generateForm").submit(function (event) {
    event.preventDefault();
    jQuery.ajax({
        type: 'POST',
        url:"/backend/admin/generate",
        data: new FormData($("#generateForm")[0]),
        processData: false, 
        contentType: false, 
        success: function(returnval) {
            $("#keysTable").css("display", "block");
            console.log(returnval);
            writeKey(returnval.key, returnval.type);
         }
    });
    return false;
  });

  function writeKey(code, type) {

    $("#keysTable").append(`
    <tr>
    <th style="border-bottom: 1px solid white; width: 300px;">${code}</th>
    <th style="border-bottom: 1px solid white; width: 300px;">${type}</th>
    </tr>
    `);

}