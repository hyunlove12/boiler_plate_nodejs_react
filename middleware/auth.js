const { User } = require('../models/user')

let auth = (req, res, next) => {
    // 인증 처리를 하는 곳
    // 클라이언트의 쿠키에서 토큰을 가져온다
    // 로그아웃을 안하고 나가게 되면 토큰값은 계속 유지?
    let token = req.cookies.x_auth

    // 토큰을 복호화 한 후 유저를 찾는다.
    User.findByToken(token, (err, user) => {
        if(err) throw err
        if(!user) return res.json({
            isAuth : false,
            error : true
        })
        req.token = token
        req.user = user
        // next -> 미들웨어 다음 로직이 실행되도록 하는 함수
        next()
    })

    // 유저가 있으면 인증 완료

    // 유저가 없으면 인증 실패
}

module.exports = { auth }