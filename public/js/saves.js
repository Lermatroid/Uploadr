function onload() {
    var all = Cookies.get();
    $("#subtitle").html(`Your Saved Uploads (${countProperties(all)} Files Saved)`)
    $.each( all, function( key, value ) {
        if(key.split("_")[0] === "f") {
            var data = JSON.parse(value);
            writeSave(data.name, data.size, data.fileID);
        }
      });
      

}

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(prop.split("_")[0] === "f") {
            if(obj.hasOwnProperty(prop))
            ++count;
        }
    }

    return count;
}

function writeSave(name, size, id) {

    $("#saveTable").append(`
    <tr>
    <th style="border-bottom: 1px solid white;">${name}</th>
    <th style="border-bottom: 1px solid white;">${size}MB</th>
    <th style="border-bottom: 1px solid white;"><a href="/f/${id}">Download</a></th>
    <th style="border-bottom: 1px solid white;"><a class="removeButton" href="#" fileid="${id}">Remove</a></th>
    </tr>
    `);

}
$(function() {
    $(".removeButton").click(function(e) {
      e.preventDefault(); 
      var removeID = $(this).attr('fileid');
      Cookies.remove("f_" + removeID);
      location.reload();
    });
  });

