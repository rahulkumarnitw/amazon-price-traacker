const express = require("express");
const bodyParser = require("body-parser");
const axios= require('axios');
const cheerio = require('cheerio');
const cron= require("node-cron");
const nodemailer= require("nodemailer");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));

nodemailer.createTransport({ sendmail: true });
const fetchPrice= async(url,pr,email) => {
  const response = await axios.get(url);
  const html= response.data;
  const $= cheerio.load(html);
  const pricetext= $('.a-offscreen').text();
  
  const price = parseFloat(pricetext.replace('₹', ''));
  
  if(pr>=price)
  {
    sendEmail(url,price,email);
  }
  else
  {
    console.log("not ok");
  }
}


app.use(express.static("public"));

app.get("/",function(req,res)
{
      res.sendFile(__dirname + "/signup.html");
});

let url;
let price;
let email;

app.post("/",function(req,res){
  url= req.body.url;
  price= req.body.price;
  email = req.body.email;
  fetchPrice(url,price,email);

  res.sendFile(__dirname+"/success.html");

  cron.schedule('*/1 * * * *', (url,price,email) => fetchPrice(url,price,email));
  // watchPrice();
});


// fetchPrice()

const sendEmail= async(url,price,email) => {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Abhishek 👻" <test@test.com>', // sender address
    to: email, // list of receivers
    subject: "Amazon Watcher", // Subject line
    text: `${price} - ${url}`+ ' Price dropped!', // plain text body
    html: `<p>${price}</p><p>${url}</p>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
