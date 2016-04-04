define(['clientCode/MultiFileClient', "text!./question.html", "text!./answer.html"], function(client, questionTemplate, answerTemplate) {
    return client(questionTemplate, answerTemplate);
});

