
# Take the first arg in a variable
VERSION=$1

#yarn deploy:studio:mainnet -l $VERSION
#yarn deploy:studio:base -l $VERSION
yarn deploy:studio:optimism -l $VERSION
yarn deploy:studio:arbitrum -l $VERSION
yarn deploy:studio:polygon-pos -l $VERSION
yarn deploy:studio:fraxtal -l $VERSION
yarn deploy:studio:ink -l $VERSION
yarn deploy:studio:scroll -l $VERSION