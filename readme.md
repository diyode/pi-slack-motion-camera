Setup guide
======

```bash
sudo apt-get update
```

Install Node.js 
======

## ( Raspberry Pi 2 & 3 ):
```bash
sudo apt-get update  
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install nodejs
```

## ( pi Zero and original Raspberry Pi ):
These Pi's use the ARMv6 CPU. Unfortunately apt-get install nodejs installs a version of node built for ARMv7, so we’ll have to install it manually.

##### Download
```bash
wget https://nodejs.org/dist/v9.5.0/node-v9.5.0-linux-armv6l.tar.gz
```

Extract the files once the download has completed.
```bash
tar -xzf node-v9.5.0-linux-armv6l.tar.gz
```

* Install
Copy the files into /user/local

```bash
sudo cp -R node-v9.5.0-linux-armv6l/* /usr/local/
```

##### Add to path
To use the node and npm commands you need to add the location we installed node (/user/local/bin) to your path.

```bash
nano ~/.profile
```

Add PATH=$PATH:/usr/local/bin at the end then press ctrl + x to exit. Type yes to save.

##### Test
```bash
node -v
```


Install Node dependencies
======
From the projects root directory run
```bash
npm install
```

this will create a node_modules directory and download the required dependencies as outlined in the package.json file.


start server
======
```bash
npm start
```

