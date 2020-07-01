# Deploy script for Screeps
# Usage:
# deploy.py <repository folder> [<repository name>]
# - Deploys the code in the selected folder into the repository of the given name; by default, the
# repository is named after the folder itself
import os
import json
import argparse
import requests

auth_email = "guedesav@brazmogu.com.br"
auth_pass = "S70n3M0lE"

def add_module(mod_name, mod_file, repo_dict):
    with open(mod_file) as module:
        print("... %s" % mod_name)
        repo_dict['modules'][mod_name] = module.read()

def list_modules(root, repo_dict, prefix=""):
    with os.scandir(root) as scanlist:
        for entry in scanlist:
            if entry.is_file():
                if entry.name.endswith('.js'):
                    add_module(prefix + entry.name[:-3], entry.path, repo_dict)
            elif entry.is_dir():
                list_modules(entry.path, repo_dict, prefix + entry.name + ".")

parser = argparse.ArgumentParser(description="Commits all code in a subfolder into a remote Screeps repository")
parser.add_argument('local_repo', type=str, help="Name of the local folder repository")
parser.add_argument('--to', dest='remote_repo', type=str, help="Name of the remote repository (defaults to the folder name itself)")

args = parser.parse_args()
if args.remote_repo == None: args.remote_repo = args.local_repo

print("Uploading '%s' to the '%s' repository..." % (args.local_repo, args.remote_repo))

repo_data = {
    'branch': args.remote_repo,
    'modules': {}
}

print("Scanning modules...")
list_modules(args.local_repo, repo_data)

response = requests.post("https://screeps.com:443/api/user/code",
    json=repo_data,
    auth=(auth_email,  auth_pass))


if response.ok: print ("OK!")