#!/usr/bin/env ruby
require 'base64'
require 'rake'
require 'json'
require 'time'
require 'xz'

def compress(x)
  Base64.encode64(XZ.compress(x))
end

Dir.chdir(File.dirname(__FILE__))

json = { data: {} }
data = json[:data]
Dir.glob('test/*.sh{,.[0-9]}').sort.each do |path|
  _, user, repo, testnum = File.basename(path).match(/^([^.]+)\.(.+)\.sh(?:\.(\d))?$/).to_a
  Dir.chdir("impl/#{user}/#{repo}") do
    sh "sh ../../../#{path}"
  end
  json_item = {}
  if testnum != nil
    conf = File.read(path).strip.each_line.take_while{ |line| line.start_with? '#'}.map{ |line| line.strip.gsub(/^#\s*/, '') }
    _, json_item['_'] = conf.select{ |line| line[/^description ./i] }[0].match(/^description (.+)$/).to_a
  end
  has_pre_script = File.exist?('aheui.pre.sh')
  has_post_script = File.exist?('aheui.post.sh')
  Dir.glob("test/snippets/**/*.out") do |testpath|
    testpath = testpath.gsub(/\.out$/, '')
    inputpath = "#{testpath}.in"
    sh "sh ./aheui.pre.sh #{testpath}.aheui" if has_pre_script
    output = `timeout 2m /usr/bin/time --format="%S %U" --output=time.tmp ./aheui #{testpath}.aheui #{"< #{inputpath}" if File.exist?(inputpath)}`
    output_exitcode = $?.exitstatus
    sh "sh ./aheui.post.sh #{testpath}.aheui" if has_post_script
    timestr = File.read('time.tmp')
    testname = testpath.gsub(%r{^test/snippets/}, '')
    if timestr.empty?
      puts "Terminated #{testname}"
      puts
      puts compress(output)
      puts
      json_item[testname] = true
    elsif File.exist?("#{testpath}.exitcode") and (expected_exitcode = File.read("#{testpath}.exitcode").to_i) != output_exitcode
      puts "Fail #{testname}: Expected exitcode was #{expected_exitcode}, but it returns #{output_exitcode}"
      json_item[testname] = false
    elsif (expected_output = File.read("#{testpath}.out").strip) != (output = output.encode('UTF-8', :invalid => :replace).strip)
      puts "Fail #{testname}"
      puts
      puts compress(output)
      puts "Expected>"
      puts compress(expected_output)
      puts
      json_item[testname] = false
    else
      time = timestr.lines[-1].split.map(&:to_f).reduce(&:+)
      puts "Pass #{testname} #{time}s"
      json_item[testname] = time
    end
  end
  data["#{user}/#{repo}#{"/#{testnum}" unless testnum == nil}"] = json_item
  File.delete('aheui') if File.exist?('aheui') || File.symlink?('aheui')
  File.delete('aheui.pre.sh') if has_pre_script
  File.delete('aheui.post.sh') if has_post_script
  File.delete('time.tmp')
end
data['_'] = Time.now.utc.iso8601

File.open('data.json', 'w') { |f| f.write(json.to_json) }
