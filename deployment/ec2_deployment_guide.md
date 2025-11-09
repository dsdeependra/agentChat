# XYZ Chatbot Backend - EC2 Deployment Guide

## Prerequisites

1. AWS Account with EC2 access
2. OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
3. Tavily API Key ([Get one here](https://tavily.com))
4. Basic knowledge of SSH and Linux commands

## Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   - **Name**: xyz-chatbot-backend
   - **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - **Instance Type**: t3.medium (recommended) or t2.medium
   - **Key Pair**: Create new or use existing key pair (save the .pem file)
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 8000) from anywhere
   - **Storage**: 20 GB gp3

3. **Launch Instance** and note the Public IP address

## Step 2: Connect to EC2 Instance

```bash
# Make key pair file read-only
chmod 400 your-key-pair.pem

# Connect to instance
ssh -i your-key-pair.pem ubuntu@<EC2-PUBLIC-IP>
```

## Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Git
sudo apt install -y git

# Install Docker (optional, for containerized deployment)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

## Step 4: Setup Application

```bash
# Create application directory
mkdir -p ~/xyz-chatbot
cd ~/xyz-chatbot

# Clone or upload your code
# Option 1: If using Git
# git clone <your-repo-url> .

# Option 2: Upload files manually using scp from your local machine
# scp -i your-key-pair.pem -r ./backend/* ubuntu@<EC2-PUBLIC-IP>:~/xyz-chatbot/
```

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env

# Add the following (replace with your actual keys):
OPENAI_API_KEY=sk-your-openai-key-here
TAVILY_API_KEY=tvly-your-tavily-key-here
OPENAI_MODEL=gpt-4
HOST=0.0.0.0
PORT=8000

# Save and exit (Ctrl+X, then Y, then Enter)
```

## Step 6: Deploy Using Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Check if running
curl http://localhost:8000/health
```

## Step 7: Deploy Without Docker (Alternative)

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

# For production, use systemd service (see below)
```

## Step 8: Create Systemd Service (For Non-Docker Deployment)

```bash
# Create service file
sudo nano /etc/systemd/system/xyz-chatbot.service
```

Add the following content:

```ini
[Unit]
Description=XYZ Chatbot Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/xyz-chatbot
Environment="PATH=/home/ubuntu/xyz-chatbot/venv/bin"
EnvironmentFile=/home/ubuntu/xyz-chatbot/.env
ExecStart=/home/ubuntu/xyz-chatbot/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable xyz-chatbot
sudo systemctl start xyz-chatbot

# Check status
sudo systemctl status xyz-chatbot

# View logs
sudo journalctl -u xyz-chatbot -f
```

## Step 9: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/xyz-chatbot
```

Add the following:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or use EC2 public IP

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/xyz-chatbot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 10: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# If you have a domain name
sudo certbot --nginx -d your-domain.com

# Follow the prompts
# Certbot will automatically configure SSL and redirect HTTP to HTTPS
```

## Step 11: Test the API

```bash
# Test health endpoint
curl http://<EC2-PUBLIC-IP>/health

# Or with domain
curl https://your-domain.com/health

# Test from your local machine
curl -X POST http://<EC2-PUBLIC-IP>/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the latest news about AI?"}'
```

## Step 12: Update Frontend Configuration

Update your React frontend to point to the EC2 backend:

```javascript
// In your React app, update the API URL
const API_BASE_URL = 'http://<EC2-PUBLIC-IP>:8000';
// Or with domain and SSL
const API_BASE_URL = 'https://your-domain.com';
```

## Monitoring and Maintenance

### View Logs (Docker)
```bash
docker-compose logs -f backend
```

### View Logs (Systemd)
```bash
sudo journalctl -u xyz-chatbot -f
```

### Restart Service (Docker)
```bash
docker-compose restart
```

### Restart Service (Systemd)
```bash
sudo systemctl restart xyz-chatbot
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart (Docker)
docker-compose down
docker-compose build
docker-compose up -d

# Or restart service (Systemd)
sudo systemctl restart xyz-chatbot
```

### Monitor Resources
```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# Check running processes
ps aux | grep uvicorn
```

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Secure API Keys**
   - Never commit .env file to Git
   - Use AWS Secrets Manager for production

4. **Enable HTTPS**
   - Always use SSL certificates in production
   - Use Let's Encrypt for free SSL

5. **Backup Vector Store**
   ```bash
   # Backup chroma_db regularly
   tar -czf chroma_backup_$(date +%Y%m%d).tar.gz chroma_db/
   ```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Service Won't Start
```bash
# Check logs
sudo journalctl -u xyz-chatbot -n 50

# Check permissions
ls -la /home/ubuntu/xyz-chatbot
```

### Out of Memory
- Upgrade to larger instance type (t3.large or t3.xlarge)
- Add swap space

## Cost Optimization

- Use AWS Free Tier eligible t2.micro/t3.micro for testing
- Stop instance when not in use
- Use Reserved Instances for production (up to 75% savings)
- Monitor CloudWatch metrics

## API Endpoints

Once deployed, your API will be available at:

- `GET /` - API information
- `GET /health` - Health check
- `POST /upload` - Upload documents
- `POST /query` - Send queries
- `GET /documents` - List documents
- `DELETE /documents` - Clear documents

## Next Steps

1. Deploy frontend to S3 + CloudFront or another EC2 instance
2. Setup CI/CD pipeline with GitHub Actions
3. Implement authentication and rate limiting
4. Add monitoring with CloudWatch
5. Setup auto-scaling for high traffic