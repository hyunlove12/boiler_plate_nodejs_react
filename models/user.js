const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
// salt의 글자 수
const saltRounds = 10

const userSchema = mongoose.Schema({
    name : {
        type : String,
        maxlength : 50,       
    },
    email : {
        type : String,
        // trim ->-> 공백을 없애주는 역할(dong hyun  -> donghyun)
        trim : true,
        unique : 1
    },
    password : {
        type : String,
        minlength : 5
    },
    lastname : {
        type : String,
        maxlength : 50
    },
    role : {
        type : Number,
        default : 0
    },
    image : String,
    token : {
        type : String
    },
    tokenExp : {
        type : Number
    }
})

// 몽구스 메소드
// save 호출 전에 함수를 실행한다.
userSchema.pre('save', function(next){
    // index.js 에서 보내준 파라미터 -> req.body
    var user = this;
    // 비밀번호를 암호화 시킨다.
    // salt 생성 후 이용하여 암호화 
    // 스크마객체에서 생성자를 받는듯...
    // password가 변환 될 때만 적용
    if (user.isModified('password')){        
        bcrypt.genSalt(saltRounds, function(err, salt){
            if(err) return next(err)
    
            bcrypt.hash(user.password, salt, function(err, hash){
                //store hash in your password DB
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        // 다음 로직 실행
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, cb) {
    // plainPassword와 암호화된 비밀번호를 비교
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb){
    var user = this
    // jsonwebtoken이용하여 토큰 생성
    // 몽고디비의 _id -> objectId
    // user._id + secretToken 토큰생성
    // secretToken -> 에서 userId 찾을 수 있다
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    user.token = token
    user.save(function(err, user) {
        if(err) return cb(err)
        cb(null, user)
    })
}
// 토큰 찾는 메소드
userSchema.statics.findByToken = function(token, cb) {
    var user = this    
    // user._id + 'secretToken' = token
    // 토큰을 decode한다
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저 아이디를 이용해서 유저를 찾은 다음에
        // 클라이언트에서 가져온 token과 db에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id" : decoded, "token" : token}, function(err, user) {
            if (err) return cb(err)
            cb(null, user)
        })
    })
}
// 스키마를 모델로 감싸준다
const User = mongoose.model('User', userSchema)

module.exports = { User }