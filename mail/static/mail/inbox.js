document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Sending email event listener
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

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
  document.querySelector('#read-view').style.display = 'none';

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

        // https://stackoverflow.com/questions/18269286/shorthand-for-if-else-statement
        element.innerHTML = `
          <div class="row email-preview border rounded p-2 mx-0 ${email.read ? 'bg-light' : 'fw-semibold'}" data-email-id="${email.id}">
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
        
        // Event listener to read email
        element.addEventListener('click', () => {
          read_email(email.id, mailbox)
        });

        emails_view.append(element);
      });
  });
}

function send_email() {

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
    }
  });

  // Prevent default form submission
  return false;
}

function read_email(email_id, mailbox) {

  // Show read view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';

  // Reset content of email
  document.querySelector('#read-view').innerHTML = '';

  // Send request to server to get specific email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

      // Create archive/unarchive button
      if (mailbox !== 'sent') {
        button = document.createElement('div');
        if (mailbox === 'inbox') {
          button.innerHTML = `
            <button class="btn btn-sm btn-outline-primary mb-2" id="archive">Archive</button>
          `;
        }
        else {
          button.innerHTML = `
            <button class="btn btn-sm btn-outline-primary mb-2" id="unarchive">Unarchive</button>
          `;
        }
        button.addEventListener('click', () => {archive_email(email)});
        document.querySelector("#read-view").append(button);
      }

      // Create email display
      const element = document.createElement('div');
      element.innerHTML = `
        <h3>${email.subject}</h3>
        <div class="row mx-0 justify-content-between">
          <div class="fw-semibold">${email.sender}</div>
          <div class="text-right small text-muted">${email.timestamp}</div>
        </div>
        <div class="row mx-0 small text-muted">
          to ${email.recipients.join(', ')}
        </div>
        <div class="row mx-0" style="white-space: pre-line;">
          ${email.body}
        </div>
      `;
      // https://stackoverflow.com/questions/61768544/n-is-not-rendering-the-text-in-new-line

      document.querySelector("#read-view").append(element);

      // Mark email as read
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
  });
}

function archive_email(email) {

  // Send request to archive or unarchive the given email
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: email.archived ? false : true
    })
  })
  .then(() => {

    // Load user inbox after archive/unarchive
    load_mailbox('inbox');
    
    console.log(email.archived ? 'Email has been unarchived' : 'Email has been archived');  
  });
}
