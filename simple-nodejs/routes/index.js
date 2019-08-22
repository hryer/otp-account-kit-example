var express = require('express');
var router = express.Router();
var guid = require('guid');
var qs = require('querystring');
var request = require('request');
var fb_config = require('./fb_config');

const me_endpoint_base_url = 'https://graph.accountkit.com/' + fb_config.account_kit_api_version + '/me';
const token_exchange_base_url = 'https://graph.accountkit.com/' + fb_config.account_kit_api_version + '/access_token';
var csrf_guid = guid.raw();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express', appId: fb_config.app_id, csrf: csrf_guid, version: fb_config.account_kit_api_version });
});

router.post('/login_success', function (req, res) {
  // CSRF check
  if (req.body.csrf === csrf_guid) {
    var app_access_token = ['AA', fb_config.app_id, fb_config.app_secret].join('|');
    var params = {
      grant_type: 'authorization_code',
      code: req.body.code,
      access_token: app_access_token
    };

    // exchange tokens
    var token_exchange_url = token_exchange_base_url + '?' + qs.stringify(params);
    request.get({ url: token_exchange_url, json: true }, function (err, resp, respBody) {
      var view = {
        user_access_token: respBody.access_token,
        expires_at: respBody.expires_at,
        user_id: respBody.id,
      };

      // get account details at /me endpoint
      var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
      request.get({ url: me_endpoint_url, json: true }, function (err, resp, respBody) {
        // send login_success.html
        if (respBody.phone) {
          view.phone_num = respBody.phone.number;
        } else if (respBody.email) {
          view.email_addr = respBody.email.address;
        }
        res.render('success', view);
      });
    });
  }
  else {
    // login failed
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end("Something went wrong. :( ");
  }
});

module.exports = router;
