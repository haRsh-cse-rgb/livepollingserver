const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');


const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


app.use(cors());
app.use(express.json());


let currentPoll = null;
let students = [];

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    
socket.on('createPoll', (pollData) => {
    currentPoll = {
        ...pollData,
        _id: Date.now(), 
        responses: [] 
    };
    io.emit('pollCreated', {
        ...currentPoll,
        correctAnswer: pollData.correctAnswer 
    });
    console.log('Poll created:', currentPoll);
});


    
    socket.on('studentJoin', (studentName) => {
        if (!students.includes(studentName)) {
            students.push(studentName);
        }
        io.emit('studentJoined', studentName); 
        console.log(`${studentName} joined the poll.`);
    });

    
    socket.on('submitAnswer', ({ studentName, answer }) => {
        if (!currentPoll) return; 

        
        const studentResponse = {
            studentName,
            answer
        };
        currentPoll.responses.push(studentResponse);

        
        io.emit('pollUpdated', currentPoll);
        console.log(`${studentName} answered: ${answer}`);
    });

    
    socket.on('closePoll', () => {
        io.emit('pollClosed');
        currentPoll = null; 
        students = []; 
        console.log('Poll closed.');
    });

    
    socket.on('kickStudent', (studentName) => {
        
        students = students.filter((student) => student !== studentName);
        currentPoll.responses = currentPoll.responses.filter((resp) => resp.studentName !== studentName);

        
        io.emit('studentKicked', studentName);
        console.log(`${studentName} was kicked out by the teacher.`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
