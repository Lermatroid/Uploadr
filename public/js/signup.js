$("#signupForm").submit(function (event) {
    $.post('/send/link', $("#bForm").serialize(), function (data) {
       console.log(`mydata`); //data is the response from the backend
    });
    event.preventDefault();
  });