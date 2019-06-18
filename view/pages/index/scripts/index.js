const emailConnect = remote.require('./controller/email-manager');

const user = {
    id: query('#user-email'),
    pwd: query('#user-password')
};

const connection = {
    host: query('#email-host'),
    port: query('#email-port')
};

const emailList = query('.email-list');
const emailLength = query('#emails-length');

const pg = query('progress');

query('form').addEventListener('submit', e => {
    e.preventDefault();
    emailConnect(connection.host.value, parseInt(connection.port.value), user.id.value, user.pwd.value)
    .then(emailReader => {
        emailReader.on('progress', progress => {
            pg.value = progress;
        });

        emailReader.getEmails(parseInt(emailLength.value) + 1, emails => {
            emailList.innerHTML = '';
            emails.forEach(email => {
                emailList
                .appendChild(
                    emailWrapper(email)
                );
            });
        });

        return;
    });
});