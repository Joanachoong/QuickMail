//to coomunicate with background 

//get DOM element 

const loginBtn = document.getElementById('loginBtn');
const checkAuthBtn = document.getElementById('checkAuthBtn');
const statusDiv = document.getElementById('status');

const myDate = new Date(); // Example Date object
const unixTimestampFromDate = Math.floor(myDate.getTime() / 1000);
console.log("the current time iis",unixTimestampFromDate);

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

  chrome.runtime.sendMessage(
  { type: "GET_EMAILS" },  // ← Not CHECK_AUTH!
  (response) => {
    if (response.success) {
      const emails = response.emails;  // ← Now this exists!
      console.log("Got emails:", emails);
      for(let i=0;i<emails.length;i++){
        const email=emails[i];
        const header=email.payload.headers;
        const sender= getHeader(header,"From");
        const title= getHeader(header,"Subject");

        console.log(`Email ${i+1}`);
         console.log(`Subject :${title}`);
          console.log(`From ${sender}`);


      }
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


// //fucntion getHeader()
function getHeader(headers, headerName) {
  const header = headers.find(h => h.name === headerName);
  return header ? header.value : 'Unknown';
}

// //fucntion getEmaillength()
// if email exsit , display how many email received in the last 6 hou using by looking returning how many email id received using .length
