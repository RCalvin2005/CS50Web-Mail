document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Sending mail event listener
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Hide error alert and clear out existing alert
  document.querySelector('#error-alert').style.display = 'none';
  document.querySelector('#error-alert').innerHTML = '';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Query API for latest emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

      const emails_view = document.querySelector('#emails-view');

      // Create div for each mail
      emails.forEach(email => {
        const element = document.createElement('div');
        emails_view.append(element);
        // https://stackoverflow.com/questions/18269286/shorthand-for-if-else-statement
        element.outerHTML = `
          <div class="row border rounded p-2 mx-0 ${email.read ? 'bg-light' : 'fw-semibold'}">
            <div class="col">
              ${email.sender}
            </div>
            <div class="col-7 text-truncate px-0">
              ${email.subject}
              <span class="text-muted font-weight-normal"> - ${email.body}</span>
            </div>
            <div class="col small d-flex align-items-center justify-content-end ${!email.read && 'fw-semibold'}">
              ${email.timestamp}
            </div>
          </div>
        `;
      });
  });
}

function send_mail() {

  // Send mail to server
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {

    // Catch any errors
    if (result.error) {

      console.log("Error:", result.error);

      // Display error alert
      const alert = document.querySelector('#error-alert');
      alert.innerHTML = result.error;
      alert.style.display = 'block';

      // https://stackoverflow.com/questions/4210798/how-to-scroll-to-top-of-page-with-javascript-jquery
      // Scroll back to top
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }
    else {
      
      console.log(result.message);

      // Load sent mailbox if sent successfully
      load_mailbox('sent');
      
      window.alert(result.message);
    }
  });

  // Prevent default form submission
  return false;
}
