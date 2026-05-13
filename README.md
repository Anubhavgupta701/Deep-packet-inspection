<div align="center">

# 🛡️ Deep Packet Inspection (DPI) System

### 🔍 Network Traffic Analysis & Packet Inspection Engine in C++

<img src="https://img.shields.io/badge/C%2B%2B-17-blue?style=for-the-badge&logo=c%2B%2B" />
<img src="https://img.shields.io/badge/Networking-DPI-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />

---

### 🚀 A beginner-friendly Deep Packet Inspection project that analyzes network packets, extracts website/domain information, and applies filtering rules using C++.

</div>

---

# 📖 What is Deep Packet Inspection (DPI)?

Deep Packet Inspection (DPI) means checking the **actual data inside internet packets**.

Normally, when data travels through the internet, it is divided into small pieces called **packets**.

A normal firewall usually checks only:

- 🌐 Source IP Address
- 🌐 Destination IP Address
- 🔌 Port Number

But DPI goes deeper.

It can inspect:

- 🌍 Website names
- 📡 Application traffic
- 🔒 TLS / HTTPS information
- 📨 HTTP requests
- 📦 Packet payload data

---

## 📌 Example

If a user opens:

```text
www.youtube.com
```

The DPI engine can detect that website name from the packet itself.

---

# 🏢 Where is DPI Used?

DPI technology is commonly used in:

- 🛡️ Firewalls
- 🦠 Antivirus systems
- 🚨 Intrusion Detection Systems (IDS)
- 🏢 Enterprise security systems
- 📊 Internet traffic monitoring tools

---

# ⚙️ What This Project Does

This project performs the following tasks:

✅ Reads packets from a PCAP file  
✅ Parses network packet data  
✅ Detects HTTP and HTTPS traffic  
✅ Extracts website/domain names  
✅ Applies filtering rules  
✅ Generates filtered output  

---

# 🔄 Simple Workflow

```text
PCAP File
    ↓
Read Packets
    ↓
Extract Website Name
    ↓
Check Rules
    ↓
Allow or Block Traffic
```

---

# ✨ Features

# 📂 Packet Reading

The project can read packets from `.pcap` files.

A **PCAP file** stores captured internet/network traffic.

### 🛠️ Tools That Generate PCAP Files

- Wireshark
- tcpdump
- Npcap

---

# 📦 Packet Parsing

Packet parsing means breaking packets into layers and understanding each part.

This project parses:

- Ethernet Header
- IP Header
- TCP Header
- HTTP Data
- TLS Data

---

# 🔒 HTTPS SNI Extraction

When HTTPS communication starts, the browser sends a:

```text
TLS Client Hello
```

Inside this packet, the website name is usually visible as:

```text
SNI (Server Name Indication)
```

This project extracts that domain name.

### 📌 Examples

```text
www.google.com
www.youtube.com
www.netflix.com
```

---

# 🌍 HTTP Host Extraction

For normal HTTP traffic, websites are found inside the:

```http
Host: example.com
```

header.

This project extracts that information.

---

# 🚫 Rule-Based Filtering

The DPI engine can compare domains against rules.

### 📌 Example Rules

```text
Block youtube.com
Allow google.com
```

---

# ⚡ Multi-Threading

The project also supports **multi-threading**.

Multi-threading means using multiple CPU threads together to process packets faster.

### 🚀 Benefits

- Faster processing
- Better performance
- Handles larger PCAP files
- Improved scalability

---

# 🗂️ Project Structure

```text
packet_analyzer/
│
├── include/
│   → Header files
│
├── src/
│   → Source code files
│
├── generate_test_pcap.py
│   → Generates test PCAP file
│
├── test_dpi.pcap
│   → Sample packet capture file
│
├── output.pcap
│   → Filtered output file
│
├── CMakeLists.txt
│   → Build configuration
│
├── WINDOWS_SETUP.md
│   → Windows setup guide
│
└── README.md
```

---

# 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| C++17 | Main programming language |
| libpcap / Npcap | Packet capture processing |
| CMake | Project build system |
| Multi-threading | Faster packet processing |
| Python | Generating test packets |

---

# 🌐 How Network Packets Work

When you open a website:

```text
Browser → Internet → Server → Response
```

Data travels in the form of packets.

Each packet contains layers.

---

## 📚 Packet Layers

```text
Ethernet Layer
      ↓
IP Layer
      ↓
TCP Layer
      ↓
HTTP / TLS Layer
```

This project reads and analyzes those layers one by one.

---

# ⚙️ Build Instructions

# 🐧 Linux Setup

Install required packages:

```bash
sudo apt update
sudo apt install build-essential cmake libpcap-dev
```

---

# 📥 Clone Repository

```bash
git clone https://github.com/your-username/Deep-packet-inspection.git

cd Deep-packet-inspection
```

---

# 🏗️ Build Project

```bash
mkdir build

cd build

cmake ..

cmake --build .
```

---

# ▶️ Run the Project

# 🧵 Single Thread Version

```bash
./dpi_engine test_dpi.pcap
```

---

# ⚡ Multi-Threaded Version

```bash
./dpi_mt test_dpi.pcap
```

---

# 🖥️ Example Output

```text
[INFO] Packet detected
[INFO] HTTPS traffic found
[INFO] Extracted SNI: www.youtube.com
[INFO] Rule matched
[BLOCKED] Traffic blocked
```

---

# 🌍 Real-World Use Cases

# 🛡️ Cybersecurity

Used for:

- Detecting malicious traffic
- Monitoring suspicious activity
- Network analysis
- Security monitoring

---

# 🏢 Enterprise Networks

Companies use DPI for:

- Blocking websites
- Monitoring employee internet usage
- Traffic filtering
- Security enforcement

---

# 📚 Learning Networking

This project helps in learning:

- TCP/IP
- Packet parsing
- HTTPS internals
- TLS handshake
- System programming
- Multi-threading
- Cybersecurity basics

---

# 🚀 Future Improvements

Possible upgrades:

- Real-time packet capture
- GUI dashboard
- Better filtering engine
- IPv6 support
- AI-based traffic detection
- Analytics dashboard

---

# 👨‍💻 Author

## Anubhav Gupta

### 💻 Software Engineer | 🌐 Networking Enthusiast | 🛡️ Cybersecurity Learner

Interested in:

- Cybersecurity
- Networking
- System Programming
- High-performance backend systems

---

# 🤝 Contributing

Anyone can contribute to this project.

### Steps

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit changes
5. Push code
6. Open Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# ⭐ Support

If you found this project useful:

🌟 Give it a star on GitHub  
🍴 Fork the repository  
📢 Share it with others

---

<div align="center">

## 🚀 Built with C++ & Networking Concepts

### 💙 Thank You for Visiting the Repository

</div>
