const voice2text = require('./voice2text.js');
const emotionRecognition = require('../openCV/listen.js');
const fs = require('fs');
const moment = require('moment');

module.exports = (app, connection) => {
    app.get('/', (req, res) => {
        res.render("landing.ejs");
    });

    app.get('/signin', (req, res) => {
        res.render("signin.ejs");
    });

    app.get('/signup', (req, res) => {
        res.render("signup.ejs");
    });

    app.get('/profile', (req, res) => {
        res.render("profile.ejs", {
            
        });
    });

    app.get('/interview/:id', (req, res) => {    
        const url = req.query.url;

        let coefficient = ''
        emotionRecognition.listen("/Users/jamesyaputra/Desktop/video.mp4", data => {
            while (data == null) {
                setTimeout(data, 250)
            }
            console.log("done")
            coefficient = data;
            const currDate = moment()

            voice2text.transformVideoToText(req.query.url)
            .then(transcript => {
                console.log("Getting grammar coefficient");
                return voice2text.getGrammarCoefficient(transcript).then(coefficient => [coefficient, transcript]);
            })
            .then(arr => {
                arr.push(coefficient)
                connection.query(`
                    BEGIN;
                    INSERT INTO sessionTable (sessionid, userid, grammarScore, facialScore) 
                    VALUES ('${currDate.second()}', '1', ${arr[0]}, ${arr[2]});
                    INSERT INTO answer (answerid, sessionid, questionid, video, transcript, grammarScore, facialScore)
                    VALUES ('${currDate.second()}', '${currDate.second()}', '${currDate.second()}', '${url}', '${arr[1]}', ${arr[0]}, ${arr[2]});
                    COMMIT;`, (err, result) => {
                        if (err) throw err;
                        console.log("result " + result);
                })
            })
            .catch(err => {
                console.error(err);
            });
        });

        let sqlcount = `SELECT COUNT(q.questionid) as count FROM question q`;
        connection.query(sqlcount, (err, result) => {
            if (err) throw err;
            console.log(result[0].count);
            if(result[0].count >= parseInt(req.params.id)) {
                let sql = `SELECT q.question FROM question q WHERE q.questionid = '${req.params.id}'`;
                var nextId = parseInt(req.params.id) + 1;
                console.log(nextId);
                connection.query(sql, (err, result) => {
                    if (err) throw err;
                    res.render("interview.ejs", {
                        question: result[0],
                        id: nextId
                    })
                });
            } else {
                res.redirect("/thankyou");
            }
        });
        
        
        // voice2text.transformVideoToText(req.query.url)
        // .then(transcript => {
        //     console.log("Done with promises");
        //     return voice2text.getGrammarCoefficient(transcript).then(coefficient => [coefficient, transcript]);
        // })
        // .then(arr => res.send(arr))
        // .catch(err => {
        //     console.error(err);
        // });

    });


    app.get('/results', (req, res) => {
        res.render('results.ejs', {

        })
    })

    app.get('/thankyou', (req, res) => {
        res.render('thankyou.ejs');
    })

}