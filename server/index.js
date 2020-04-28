const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose')
// 대소문자 구분을 안하면 자동으로 똑같은 파일을 생성하는듯.,,,?
const { User } = require('./models/user')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const config = require('./config/key')
const { auth } = require('./middleware/auth')

// 클라이언트에서 오는 정보를 서버에서 분석해서 가져올 수 있도록
// application/x-www-form-urlencoded 타입 분석
app.use(bodyParser.urlencoded({extended : true}))
// application/json 타입 분석
app.use(bodyParser.json())
app.use(cookieParser())

mongoose.connect(config.mongoURI, {
    useNewUrlParser : true, useUnifiedTopology : true, useCreateIndex : true, useFindAndModify : false
}).then(() => console.log('MONGODB CONNECTED'))
  .catch(err => console.log(err))



app.get('/', (req, res) => res.send('Hello!'))

// 회원가입을 위한 라우터
app.post('/api/users/register', (req, res) => {
  // 회원가입할 때 필요한 정보들을 client에서 가져오면
  // 그것들을 데이터 베이스에 넣어준다.  
  // request body값을 parsing해준다
  const user = new User(req.body)
  // 몽고db에 save
  user.save((err, userInfo) => {
    if(err) return res.json({ success : false, err })
    return res.status(200).json({
      success : true
    })   
  })
})

// 로그인 라우터
app.post('/api/users/login', (req, res) => {

  // 요청 된 이메일을 데이터베이스에서 검색
  User.findOne({ email : req.body.email }, (err, user) => {
    if(!user){
      return res.json({
        loginSuccess : false,
        message : "제공된 이메일에 해당되는 유저가 없습니다."
      })
    }
    // 요청 된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch)
      return res.json({
        loginSuccess : false,
        message : "비밀번호가 틀렸습니다."
      })
      // 비밀번호까지 맞다면 토큰 생성
      user.generateToken((err, user) => {
        if(err) return res.status(400).send(err)
        // 토큰을 저장한다. 어디에? 쿠키, 로컬스토리지, 세션 등등 -> 분산해서 저장하는 방법은?
        // x_auth로 토큰을 쿠키에 저장
        res.cookie("x_auth", user.token) 
        .status(200)
        .json({
          loginSuccess : true,
          userId : user._id
        })        
      })
    })
  })

})

// 인증 라우터
// auth라는 미들웨어 -> 콜백 함수 실행 전 처리
app.get('/api/users/auth', auth, (req, res) => {
  
  // 미들웨어를 통과하면 authentication이 true
  // role 1 admin, role 2 특정 부서 어드민
  // role 0 -> 일반유저, role 0이 아니면 관리자
  res.status(200).json({
    _id : req.user._id,
    isAdmin : req.user.role === 0 ? false : true,
    isAuth : true,
    email : req.user.email,
    name : req.user.name,
    lastname : req.user.lastname,
    role : req.user.role,
    image : req.user.image
  })
})

// 로그아웃 라우터
app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id : req.user._id }, 
    {token : ""},  
  (err, user) => {
    if (err) return res.json({
      success : false, 
      err
    })
    return res.status(200).send({
      success : true
    })
  })
})

app.get('/api/hello', (req, res) => {
  res.send('안녕하세요!')
})

app.listen(port, () => console.log(`listening ${port}`))