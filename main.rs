use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;

fn main() {
    let host = "localhost";
    let port = 1234;
    let data = "(+ 34 2)";

    let mut stream = TcpStream::connect((host, port)).expect("Failed to connect to server");
    stream.write_all(data.as_bytes()).expect("Failed to send data to server");

    let mut reader = BufReader::new(&stream);
    let mut response = String::new();
    reader.read_line(&mut response).expect("Failed to read response from server");

    println!("{}", response);
}

