require 'sinatra'
require 'omniauth-asana'
require 'ostruct'

set :port, ENV['PORT']
set :public_folder, "../public/"

use Rack::Session::Cookie
use OmniAuth::Builder do
  provider :asana, '8553566333610', 'f88b25a10daa85f09a9eb35d3bda0b85'
end

get '/' do
  if session[:auth]
    <<-HTML
    Welcome, #{session[:user][:name]}!
    Your token is #{session[:auth].token}, your id is #{session[:uid]}
    <a href='/logout'>Logout</a>
    HTML
  else
    <<-HTML
    <p>Sinatra demo app for Asana OAuth</p>
    <a href='/auth/asana'><img src="/asana-oauth-button.png"</a>
    HTML
  end
end

get '/auth/:name/callback' do
  auth = request.env['omniauth.auth']
  session[:auth] = auth.credentials
  session[:uid] = auth.uid
  session[:user] = auth.info
  redirect '/'
end

get '/auth/failure' do
  raise StandardError, params
end

get '/logout' do
  session.destroy
  redirect '/'
end