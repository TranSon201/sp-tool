var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const PopNode = require('node-pop3');
const {simpleParser} = require('mailparser');

router.post('/mail/import', function (req, res, next) {
    try {
        fs.writeFile("./accounts.txt", req.body.email, function (err) {
            if (err) {
                return res.json({success: false})
            }
            return res.json({success: true})
        });
    } catch (e) {
        return res.json({success: false})
    }
});

/* GET users listing. */
router.post('/mail/check', function (req, res, next) {
    try {
        fetchEmails(req.body.email, req.body.pw, function (data) {
            return res.json(data)
        }).then(r => {

        })
    } catch (e) {
        return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    }
});
router.post('/mail/register/check', function (req, res, next) {
    try {
        const accounts = fs.readFileSync('./accounts.txt', {encoding: 'utf8', flag: 'r'})
            .trim()
            .replace(/(\r|\r)/gm, "")
            .split('\n')
            .map(line => line.split('|'));
        let valid = false;
        for (let i = 0; i < accounts.length; i++) {
            let info = accounts[i];
            if (info[0] === req.body.email.trim()) {
                valid = true;
                try {
                    fetchEmails(req.body.email, info[1], function (data) {
                        return res.json(data)
                    }).then(r => {
                    })
                } catch (e) {
                    return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
                }
                break;
            } else {
                if (i === accounts.length - 1 && !valid) {
                    return res.json({status: false, value: "Email không nằm trong hệ thống! Liên hệ admin để hỗ trợ."})
                }
            }
        }
    } catch (e) {
        console.log(e)
        return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    }
});

async function fetchEmails(username, password, callback) {
    const pop3Command = new PopNode({
        user: username,
        password: password,
        host: 'pop-mail.outlook.com',
        port: 995,
        tls: true,
    });
    try {
        let emailsList = await pop3Command.UIDL();  // fetch list of all emails
        let msg = await pop3Command.RETR(emailsList.length);  // fetch the email content
        simpleParser(msg, (err, parsed) => {
            if (err) {
                pop3Command.QUIT();
                return callback({status: false, value: "Lỗi"})
            }
            pop3Command.QUIT();
            return callback({status: false, value: parsed.html})
        });
    } catch (e) {
        pop3Command.QUIT();
        return callback({status: false, value: "Lỗi"})
    }
    // // Cấu hình IMAP
    // const imap = new Imap({
    //   user: username,
    //   password: password,
    //   host: 'pop-mail.outlook.com',
    //   port: 995,
    //   tls: true,
    // });
    //
    // // Hàm mở hộp thư
    // function openInbox(cb) {
    //   imap.openBox('INBOX', true, cb);
    // }
    //
    // // Sự kiện khi có lỗi
    // imap.once('error', function(err) {
    //   console.log(err)
    //   return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    // });
    //
    // // Sự kiện khi đóng kết nối
    // imap.once('end', function() {
    //
    // });
    // // Kết nối đến máy chủ IMAP
    // imap.connect();
    //
    // // Sự kiện khi đã sẵn sàng
    // imap.once('ready', function() {
    //   openInbox(function(err, box) {
    //     if (err) {
    //       console.log("Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!     444")
    //       return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    //     };
    //     imap.search(['UNSEEN'], function(err, results) {
    //       if (err) {
    //         console.log("Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!     333")
    //         return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    //       };
    //       if (results.length > 0) {
    //         const lastEmail = results[results.length - 1]; // Lấy email cuối cùng từ danh sách kết quả
    //         const f = imap.fetch(lastEmail, { bodies: '' });
    //         f.on('message', function(msg, seqno) {
    //           msg.on('body', function(stream, info) {
    //             simpleParser(stream, (err, parsed) => {
    //               if (err) throw err;
    //               imap.end();
    //               return callback({status: false, value: parsed.html})
    //             });
    //           });
    //         });
    //         f.once('error', function(err) {
    //           console.log("Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!   222")
    //           return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
    //         });
    //         f.once('end', function() {
    //           console.log('Done fetching the message!');
    //           imap.end();
    //         });
    //       } else {
    //         imap.end();
    //         console.log("Tài khoản này không thể đọc mail!     111")
    //         return callback({status: false, value: "Tài khoản này không thể đọc mail!"})
    //       }
    //     });
    //   });
    // });
}


module.exports = router;
