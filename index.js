const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const uri = `mongodb+srv://eTuitionBD:eTuitionBD_B12_A11@cluster0.0ijmspx.mongodb.net/?appName=Cluster0`