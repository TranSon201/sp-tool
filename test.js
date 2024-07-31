const Pop3Command = require('node-pop3');
async function test() {
    const pop3 = new Pop3Command({host: 'outlook.office365.com'});

// These must be in order
    await pop3.connect();
    await pop3.command('USER', 'Ethanwy1qj0@hotmail.com');
    await pop3.command('PASS', 'Shopmail2000@0304');

    const [statInfo] = await pop3.command('STAT');
    const [retrInfo, retrStream] = await pop3.command('RETR', 1);

    console.log(statInfo); // 100 102400
    console.log(retrInfo); // 1024 octets

    const [quitInfo] = await pop3.command('QUIT');
    console.log(quitInfo); // Logging out.

    const streamString = await Pop3Command.stream2String(retrStream);
    console.log(streamString); // <message details...>

    console.log(
        await Pop3Command.listify(streamString)
    ); // [ ['Return-Path:', 'brett@...'], ...]
}

test()