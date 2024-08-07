const PopNode = require('node-pop3');
const {simpleParser} = require('mailparser');
async function test() {
    const pop3Command = new PopNode({
        user: 'Ethanwy1qj0@hotmail.com',
        password: 'Shopmail2000@0304',
        host: 'pop-mail.outlook.com',
        port: 995,
        tls: true,
    });


    let emailsList = await pop3Command.UIDL();  // fetch list of all emails
    let msg = await pop3Command.RETR(1);  // fetch the email content
    let parsedEmail = await simpleParser(msg);
    console.log(parsedEmail)
}

test()