#!/usr/bin/env ruby
require 'base64'
require 'rake'
require 'json'
require 'time'
require 'zlib'

def deflate(x)
  Base64.encode64 Zlib::Deflate.deflate(x)
end

Dir.chdir(File.dirname(__FILE__))

json = { data: {} }
data = json[:data]
Dir.glob('test/*.sh').each do |path|
  user, repo, _ = File.basename(path).split('.')
  puts cmd = "git clone https://github.com/#{user}/#{repo} --depth=1 -b master"
  `#{cmd}`
  Dir.chdir(repo) do
    sh "sh ../#{path}"
  end
  json_item = {}
  has_pre_script = File.exist?('aheui.pre.sh')
  has_post_script = File.exist?('aheui.post.sh')
  Dir.glob("snippets/**/*.out") do |testpath|
    testpath = testpath.gsub(/\.out$/, '')
    inputpath = "#{testpath}.in"
    sh "sh ./aheui.pre.sh #{testpath}.aheui" if has_pre_script
    output = `timeout 2m /usr/bin/time --format="%S %U" --output=time.tmp ./aheui #{testpath}.aheui #{"< #{inputpath}" if File.exist?(inputpath)}`
    output_exitcode = $?.exitstatus
    sh "sh ./aheui.post.sh #{testpath}.aheui" if has_post_script
    timestr = File.read('time.tmp')
    tp = testpath.gsub(/^snippets\//, '')
    if timestr.empty?
      puts "Terminated #{tp}"
      puts ""
      puts deflate(output)
      puts ""
      json_item[tp] = true
    elsif File.exist?("#{testpath}.exitcode") and (expected_exitcode = File.read("#{testpath}.exitcode").to_i) != output_exitcode
      puts "Fail #{tp}: Expected exitcode was #{expected_exitcode}, but it returns #{output_exitcode}"
      json_item[tp] = false
    elsif (expected_output = File.read("#{testpath}.out").strip) != (output = output.encode('UTF-8', :invalid => :replace).strip)
      puts "Fail #{tp}"
      puts ""
      puts deflate(output)
      puts "Expected>"
      puts deflate(expected_output)
      puts ""
      json_item[tp] = false
    else
      time = timestr.lines[-1].split.map(&:to_f).reduce(&:+)
      puts "Pass #{tp} #{time}s"
      json_item[tp] = time
    end
  end
  json_item['_'] = nil
  data["#{user}/#{repo}"] = json_item
  rm_rf repo
  File.delete('aheui') if File.exist?('aheui') || File.symlink?('aheui')
  File.delete('aheui.pre.sh') if has_pre_script
  File.delete('aheui.post.sh') if has_post_script
  File.delete('time.tmp')
end
data['_'] = Time.now.utc.iso8601

File.open('data.json', 'w') { |f| f.write(json.to_json) }
