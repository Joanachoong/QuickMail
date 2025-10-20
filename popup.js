//to coomunicate with background 

//get DOM element 

const loginBtn = document.getElementById('loginBtn');
const checkAuthBtn = document.getElementById('checkAuthBtn');
const statusDiv = document.getElementById('status');

// a function to show the message status 
function showStatus(message, isSucess){
    statusDiv.textContent=message;
    statusDiv.className=isSucess?'success':'error';
}

//LOGIN BUTTON
loginBtn.addEventListener('click',async()=>{
    console.log("Login button clicked");
    showStatus("Starting authentication....",true);
// Send message to background.js
  chrome.runtime.sendMessage(
    { type: "START_AUTH" },
    (response) => {
      console.log("Response from background:", response);
      
      if (response.success) {
        showStatus( response.message, true);
      } else {
        showStatus(response.message, false);
      }
    }
  );
});

//CHECK AUTH BUTTON

checkAuthBtn.addEventListener('click',()=>{
    //message show button was clicked 
    console.log("Button clicked");
   
// Send message to background.js( confirm if the use ris autenticated)
  chrome.runtime.sendMessage(
    { type: "CHECK_AUTH" },
    (response) => {
      if (response.authenticated) {
        showStatus("Login successful",true);
      } else {
        showStatus(" Not logged in" , false);
      }
    }
  );
});

chrome.runtime.sendMessage(
    {type:"CHECK_AUTH"},
    (response)=>{
    if(response.authenticated){
        showStatus("Already logged in",true);
    }else{
         showStatus("NOT LOGGED IN",false);

    }
}
    

);