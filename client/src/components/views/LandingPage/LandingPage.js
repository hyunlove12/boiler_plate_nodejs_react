import React, { useEffect } from 'react'
import axios from 'axios'

function LandingPage() {

    useEffect(() => {
        // '/api/hello' -> cors 문제        
        axios.get('/api/hello')
            .then(res => console.log(res.data))
    }, [])

    return (
        <div>
            LandingPage
        </div>
    )
}

export default LandingPage