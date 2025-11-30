# School Fees Management Platform - Production Deployment Guide

## 🎉 Deployment Complete!

Your School Fees Management Platform has been successfully deployed to production.

---

## 📋 Server Information

- **Server IP**: `72.62.51.6`
- **Operating System**: Ubuntu 24.04 LTS
- **Node.js Version**: v20.19.6
- **MySQL Version**: 8.0.44
- **Nginx Version**: 1.24.0
- **PM2 Version**: 6.0.14

---

## 🌐 Access URLs

### For Local Testing (using IP):
- **Frontend**: http://72.62.51.6
- **Backend API**: http://72.62.51.6/api (via Nginx proxy)
- **phpMyAdmin**: Configure domain or use direct access

### For Production (configure your domain):
1. Point your domain DNS A records to: `72.62.51.6`
2. Update Nginx configuration at `/etc/nginx/sites-available/schoolfees`
3. Replace:
   - `schoolfees.local` with your actual domain (e.g., `schoolfees.com`)
   - `api.schoolfees.local` with your API subdomain (e.g., `api.schoolfees.com`)
   - `phpmyadmin.schoolfees.local` with your phpMyAdmin subdomain (e.g., `db.schoolfees.com`)
4. Restart Nginx: `systemctl restart nginx`

---

## 🗄️ Database Information

- **Database Name**: `school_fees_db`
- **Database User**: `schoolfees_user`
- **Database Password**: `SchoolFees@2024!`
- **Database Host**: `localhost`
- **Database Port**: `3306`

### phpMyAdmin Access:
1. Configure domain in Nginx (see above)
2. Access via: http://phpmyadmin.yourdomain.com
3. Login with database credentials above

---

## 🔐 Default Application Credentials

After first run, login as super admin:
- **Email**: `admin@schoolfees.com`
- **Password**: `Admin@123` ⚠️ **CHANGE THIS IMMEDIATELY!**

---

## 🚀 CI/CD Pipeline Setup

### GitHub Actions Configuration

The CI/CD pipeline is already configured! To enable automatic deployments:

1. **Go to your GitHub repository settings**:
   ```
   https://github.com/awesome-urch/schoolfees/settings/secrets/actions
   ```

2. **Add the following secrets**:

   - **SERVER_HOST**
     ```
     72.62.51.6
     ```

   - **SERVER_USERNAME**
     ```
     root
     ```

   - **SERVER_SSH_KEY**
     - Run this command on your server to get the private key:
       ```bash
       cat ~/.ssh/id_ed25519
       ```
     - Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
     - Paste it as the secret value

3. **Test the pipeline**:
   - Make any change to your local repository
   - Commit and push to the `main` branch:
     ```bash
     git add .
     git commit -m "Test CI/CD pipeline"
     git push origin main
     ```
   - Check the Actions tab in your GitHub repository to see the deployment in progress

---

## 📦 Application Management

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs schoolfees-backend
pm2 logs schoolfees-frontend

# Restart applications
pm2 restart all
pm2 restart schoolfees-backend
pm2 restart schoolfees-frontend

# Stop applications
pm2 stop all

# Start applications
pm2 start ecosystem.config.js
```

### Manual Deployment

If you need to deploy manually:

```bash
cd /var/www/schoolfees
bash deploy.sh
```

---

## 🔧 Configuration Files

### Backend Environment (.env)
Location: `/var/www/schoolfees/backend/.env`

Key configurations:
- Database credentials
- JWT secrets
- Paystack API keys (update with your real keys)
- Frontend URL

### Frontend Environment (.env.local)
Location: `/var/www/schoolfees/frontend/.env.local`

Key configurations:
- API URL
- Paystack public key

### Nginx Configuration
Location: `/etc/nginx/sites-available/schoolfees`

---

## 🔒 Security Recommendations

1. **Update Paystack Keys**:
   - Replace test keys with production keys in:
     - `/var/www/schoolfees/backend/.env`
     - `/var/www/schoolfees/frontend/.env.local`

2. **Change JWT Secret**:
   - Update `JWT_SECRET` in `/var/www/schoolfees/backend/.env`

3. **Change Default Admin Password**:
   - Login and change the super admin password immediately

4. **Set up SSL/TLS**:
   ```bash
   # Install Certbot
   apt install -y certbot python3-certbot-nginx
   
   # Get SSL certificate (after configuring your domain)
   certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
   ```

5. **Configure Firewall**:
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```

6. **Secure MySQL**:
   ```bash
   mysql_secure_installation
   ```

---

## 📊 Monitoring

### Check Application Health

```bash
# Check if applications are running
pm2 status

# Check Nginx status
systemctl status nginx

# Check MySQL status
systemctl status mysql

# View application logs
pm2 logs --lines 100
```

### Log Files

- **PM2 Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **MySQL Logs**: `/var/log/mysql/`

---

## 🐛 Troubleshooting

### Applications not starting?
```bash
pm2 logs
pm2 restart all
```

### Database connection errors?
```bash
# Check MySQL is running
systemctl status mysql

# Test database connection
mysql -u schoolfees_user -p school_fees_db
```

### Nginx errors?
```bash
# Test configuration
nginx -t

# Check logs
tail -f /var/log/nginx/error.log
```

### Port conflicts?
```bash
# Check what's using ports
netstat -tulpn | grep -E ':(3000|5000|80|443)'
```

---

## 🔄 Updating the Application

### Automatic (via CI/CD):
Just push to the main branch:
```bash
git push origin main
```

### Manual:
```bash
cd /var/www/schoolfees
git pull origin main
bash deploy.sh
```

---

## 📞 Support

- **Repository**: https://github.com/awesome-urch/schoolfees
- **Server Location**: `/var/www/schoolfees`
- **Deployment Script**: `/var/www/schoolfees/deploy.sh`
- **PM2 Config**: `/var/www/schoolfees/ecosystem.config.js`

---

## ✅ Deployment Checklist

- [x] Node.js, MySQL, Nginx, phpMyAdmin installed
- [x] Repository cloned
- [x] Database created and configured
- [x] Environment files created
- [x] Dependencies installed
- [x] Applications built
- [x] PM2 configured for process management
- [x] Nginx configured as reverse proxy
- [x] CI/CD pipeline set up
- [ ] GitHub Actions secrets configured (ACTION REQUIRED)
- [ ] Domain DNS configured (if using custom domain)
- [ ] SSL certificate installed (recommended)
- [ ] Paystack production keys added (ACTION REQUIRED)
- [ ] Default admin password changed (ACTION REQUIRED)
- [ ] Firewall configured (recommended)

---

## 🎯 Next Steps

1. **Configure GitHub Actions secrets** (see CI/CD section above)
2. **Update Paystack API keys** with your production keys
3. **Configure your domain** and point it to `72.62.51.6`
4. **Install SSL certificate** using Certbot
5. **Change default admin password**
6. **Test the application** thoroughly
7. **Set up backups** for database and files

---

**Deployment Date**: November 30, 2025
**Deployed By**: Cascade AI Agent
