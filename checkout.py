# Checkout script from Screeps
# Usage:
# checkout.py <repository name> [<repository folder>]
# - Deploys the code in the selected remote repository into the folder of the given name; by default,
# the folder is named after the repository itself
import os
import json
import argparse
import requests

auth_email = "guedesav@brazmogu.com.br"
auth_pass = "S70n3M0lE"

parser = argparse.ArgumentParser(description="Commits all code in a subfolder into a remote Screeps repository")
parser.add_argument('remote_repo', type=str, help="Name of the remote repository")
parser.add_argument('--to', dest='local_repo', type=str, help="Name of the local folder repository (defaults to the repository name itself)")

args = parser.parse_args()
if args.local_repo == None: args.local_repo = args.remote_repo

print("Downloading '%s' to the '%s' folder..." % (args.remote_repo, args.local_repo))

response = requests.get("https://screeps.com:443/api/user/code?branch=" + args.remote_repo,
    json={
        'branch': args.remote_repo
    },
    auth=(auth_email,  auth_pass))

modules = {}
if response.ok:
    modules = json.loads(response.text)['modules']

for mod_name, contents in modules.items():
    mod_file = mod_name.replace(".", os.sep) + ".js"
    mod_dir = args.local_repo
    if mod_name.count(".") > 0:
        mod_dir = os.path.join(mod_dir, mod_name.rsplit(".", 1)[0].replace(".", os.sep))
    os.makedirs(mod_dir, exist_ok=True)
    print("Writing %s => %s..." % (mod_name, mod_file))
    with open(os.path.join(args.local_repo, mod_file), "w") as module:
        module.write(contents)

