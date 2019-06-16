const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const redis = require('redis')

const app = express()

const client = redis.createClient()

client.on('connect', function() {
    console.log('Redis server connected')
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {

    client.lrange('tasks', 0, -1, function(err, tasks) {
        client.hgetall('call', function(err, call) {
            res.render('index', {
                title: 'test',
                tasks,
                call
            })
        })
    })
})

app.post('/task/add', function(req, res) {
    const task = req.body.task

    client.rpush('tasks', task, function(err, reply) {
        if (err) {
            console.error(err)
        }

        res.redirect('/')
    })
})

app.post('/task/delete', function(req, res) {
    const tasksToDel = req.body.tasks

    client.lrange('tasks', function(err, tasks) {
        tasksToDel.forEach(task => {
            if(tasksToDel.some(function(t) {
                return t === task 
            } )) {
                client.lrem('tasks', 0, task, function(err) {
                    if (err) {
                        console.error(err)
                    }
                })
            }
        });

        res.redirect('/')
    })
})

app.post('/call/add', function(req, res) {
    const { name, company, phone, time } = req.body
    client.hmset('call', ['name', name, 'company', company, 'phone', phone, 'time', time], function(err, reply) {
        if (err) {
            console.error(err)
        }

        console.log(reply)
        res.redirect('/')
    })
})

app.listen(3000)