import yayJpg from '../assets/yay.jpg';
import {Button, Input, Spin} from "antd";
import './index.less'
import {useEffect, useRef, useState} from "react";
export default function HomePage() {
    // @ts-ignore
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition||window.mozSpeechRecognition||window.msSpeechRecognition
    const recognition=new SpeechRecognition()



//存数据
    const [messages, setMessages] = useState<{ text: string, isUser: boolean }[]>([]);
//输入框
    const [inputText, setInputText] = useState('');
    const [wsConfig, setWsConfig] = useState({id: ''})
    const [status, setStatus] = useState('DISCONNECTED');
    const [showLoading, setShowLaoding] = useState(false)
    const [isListening, setIsListening] = useState(false);

    const socket = useRef<any>(null);

    useEffect(() => {
        console.log(1)
        saveToLocalStorage('wsData', [])
        saveToLocalStorage('id', [])
        // 创建 WebSocket 连接
        socket.current = new WebSocket('ws://47.101.154.34:8000/openai/chats');

        socket.current.onopen = () => {
            setStatus('CONNECTED');
            console.log('WebSocket connected');
        };

        socket.current.onclose = () => {
            setStatus('DISCONNECTED');
            console.log('捏麻麻滴为什么要关闭');
        };

        socket.current.onmessage = (event:any) => {
            handleMessage(event.data)
            // addToData('wsData', {text: event.data, isUser: false})
            if (getFromLocalStorage('id').length === 0) {
                addToData('id', event.data)
            } else {
                addToData('wsData', {text: event.data, isUser: false})
                setShowLaoding(false)
            }
        };

        socket.current.onerror = (error:any) => {
            console.error('WebSocket error:', error);
        };
        // 在组件卸载时关闭 WebSocket 连接
        return () => {
            // socket.current.close();
        };

    }, []);

    const sendMessage = () => {
        setShowLaoding(true)
        const id = getFromLocalStorage('id')[0]
        console.log(`{content: ${inputText}, sender: ${id}}`)
        // setMessages([...messages, {text: inputText, isUser: true}]);
        addToData('wsData', {text: inputText, isUser: true})
        socket.current.send(`{"content": "${inputText}", "sender": "${id}"}`);
        setInputText('');

    };
    const handleMessage=(data:any)=>{
        console.log('------data-------',messages,data)
    }


    const handleInputChange = (event:any) => {
        setInputText(event.target.value);
    };


    // 将对象数组存储到 localStorage
    function saveToLocalStorage(key:string, data:any) {
        localStorage.setItem(key, JSON.stringify(data));
    }

// 从 localStorage 读取对象数组
    function getFromLocalStorage(key:string) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // 添加新元素到对象数组并保存到 localStorage
    function addToData(key:string, newItem:any) {
        let data = getFromLocalStorage(key);
        data.push(newItem);
        saveToLocalStorage(key, data);
    }

    setInterval(() => {
        setMessages(getFromLocalStorage('wsData'))
    }, 1000)


    useEffect(() => {
        console.log(isListening)
        console.log(recognition)
        if (!recognition) {
            console.error('SpeechRecognition is not supported in this browser.');
            return;
        }

        // 设置识别语言为中文
        recognition.lang = 'zh-CN';

        // 设置连续识别模式
        recognition.continuous = true;

        // 识别结果处理123123
        recognition.onresult = (event) => {
            console.log(event)
            const transcript = event.results[event.resultIndex][0].transcript;
            setInputText(prevText => prevText + transcript);
        };

        // 识别结束处理
        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            }
        };

        // 错误处理
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
        };
    }, [isListening]);
    const test = () => {
        setIsListening(true)
        recognition.start()
    }
    const endListen=()=>{
        recognition.stop();
    }
    return (
        <div className="main">

            <div className="chat-window">
                {messages.map((message, index) => {
                    return (
                        <div style={{width: '100%'}} key={index}>
                            <div
                                key={index}
                                style={{marginBottom: 15}}
                                className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
                            >
                                {message.text}
                            </div>
                        </div>
                    )
                })}
                <Spin spinning={showLoading} delay={100}/>
            </div>
            <div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center'}}>
                <Input
                    style={{width: '70%', marginRight: 30, height: '40px', borderRadius: 20}}
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="请输入消息..."
                    onPressEnter={sendMessage}
                />
                <Button type="primary" className={'sendBtn'} onClick={sendMessage}>发送</Button>
                <Button onClick={test}>test</Button>
                <Button onClick={endListen}>结束</Button>
            </div>
        </div>

    )
}
