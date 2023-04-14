#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;


#[tauri::command]
fn send_data_to_server(host: &str, port: &str, data: &str) -> String{
  let mut stream = TcpStream::connect((host, 1234)).expect("Failed to connect to server");
  stream.write_all(data.as_bytes()).expect("Failed to send data to server");

  let mut reader = BufReader::new(&stream);
  let mut response = String::new();
  reader.read_line(&mut response).expect("Failed to read response from server");
  println!("{}", response);
  response
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_data_to_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
