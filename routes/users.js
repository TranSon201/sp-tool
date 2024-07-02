var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const {simpleParser} = require('mailparser');

/* GET users listing. */
router.post('/mail/check', function(req, res, next) {
  try {
    fetchEmails(req.body.email, req.body.pw, function (data) {
      return res.json(data)
    })
  }
  catch (e) {
    return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
  }
});
router.post('/mail/register/check', function(req, res, next) {
  try {
    const accounts = fs.readFileSync('./accounts.txt', { encoding: 'utf8', flag: 'r' })
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
          fetchEmails(req.body.email,info[1], function (data) {
            return res.json(data)
          })
        }
        catch (e) {
          return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
        }
      } else {
        if (i === accounts.length - 1&& !valid) {
          return res.json({status: false, value: "Email không nằm trong hệ thống! Liên hệ admin để hỗ trợ."})
        }
      }
    }
  }
  catch (e) {
    console.log(e)
    return res.json({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
  }
});

function fetchEmails(username, password, callback) {
  // Cấu hình IMAP
  const imap = new Imap({
    user: username,
    password: password,
    host: 'imap-mail.outlook.com',
    port: 993,
    tls: true
  });

  // Hàm mở hộp thư
  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  // Sự kiện khi có lỗi
  imap.once('error', function(err) {
    return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
  });

  // Sự kiện khi đóng kết nối
  imap.once('end', function() {

  });

  // Kết nối đến máy chủ IMAP
  imap.connect();

  // Sự kiện khi đã sẵn sàng
  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) {
        return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
      };
      imap.search(['UNSEEN'], function(err, results) {
        if (err) {
          return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
        };
        if (results.length > 0) {
          const lastEmail = results[results.length - 1]; // Lấy email cuối cùng từ danh sách kết quả
          const f = imap.fetch(lastEmail, { bodies: '' });
          f.on('message', function(msg, seqno) {
            msg.on('body', function(stream, info) {
              simpleParser(stream, (err, parsed) => {
                if (err) throw err;
                const subject = `Subject: ${parsed.subject}\n `;
                const body = `Body: ${parsed.text}\n`;
                const subjectText = parsed.subject;
                const timeout = (new Date().getTime() - new Date(parsed.date).getTime())/60000;
                const from = parsed.from.text;
                const data =  subject + body;
                imap.end();
                return callback({status: false, value: parsed.html})
              });
            });
          });
          f.once('error', function(err) {
            return callback({status: false, value: "Lỗi hệ thống hoặc sai email mật khẩu! Vui lòng thử lại!"})
          });
          f.once('end', function() {
            console.log('Done fetching the message!');
            imap.end();
          });
        } else {
          return callback({status: false, value: "Tài khoản này không thể đọc mail!"})
          imap.end();
        }
      });
    });
  });
}


module.exports = router;
