#!/usr/bin/env ruby
require 'json'
require 'fileutils'

Dir.chdir(File.dirname(__FILE__))

json = { data: {} }
data = json[:data]
Dir.entries('test').each do |path|
  next if path == '.' or path == '..'
  user, repo, _ = path.split('.')
  puts cmd = "git clone https://github.com/#{user}/#{repo} --depth=1 -b master"
  `#{cmd}`
  Dir.chdir(repo) do
    `sh ../test/#{path}`
  end
  json_item = {}
  has_pre_script = File.exist?("./aheui.pre.sh")
  has_post_script = File.exist?("./aheui.post.sh")
  Dir.glob("snippets/**/*.out") do |testpath|
    testpath = testpath.gsub(/\.out$/, '')
    inputpath = "#{testpath}.in"
    `sh ./aheui.pre.sh #{testpath}.aheui` if has_pre_script
    output = `timeout 2m /usr/bin/time --format="%S %U" --output=time.tmp ./aheui #{testpath}.aheui #{"< #{inputpath}" if File.exist?(inputpath)}`
    exitcode = $?.exitstatus
    `sh ./aheui.post.sh #{testpath}.aheui` if has_post_script
    timestr = File.read('time.tmp')
    tp = testpath.gsub(/^snippets\//, '')
    if timestr.empty?
      puts "Terminated #{tp}"
      json_item[tp] = true
    elsif File.exist?("#{testpath}.exitcode") and File.read("#{testpath}.exitcode").to_i != exitcode or File.read("#{testpath}.out").strip != output.encode('UTF-8', :invalid => :replace).strip
      puts "Fail #{tp}"
      json_item[tp] = false
    else
      time = timestr.lines[-1].split.map(&:to_f).reduce(&:+)
      puts "Pass #{tp} #{time}s"
      json_item[tp] = time
    end
  end
  json_item['_'] = nil
  data["#{user}/#{repo}"] = json_item
  FileUtils.rm_rf(repo)
  File.delete('aheui') if File.exist?('aheui') || File.symlink?('aheui')
  File.delete('aheui.pre.sh') if has_pre_script
  File.delete('aheui.post.sh') if has_post_script
  File.delete('time.tmp')
end
data['_'] = `date -Iseconds`.strip

File.open('data.json', 'w') { |f| f.write(json.to_json) }
