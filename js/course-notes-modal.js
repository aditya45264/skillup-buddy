// course-notes-modal-FIXED.js
// Complete working version with proper styling

/**
 * Display course notes in a beautiful scrollable modal with proper formatting
 */
function showNotesModal(courseNote) {
    // Remove existing modal if any
    const existingModal = document.getElementById('courseNotesModal');
    if (existingModal) {
        existingModal.remove();
    }

    const content = courseNote.content || {};
    
    // Create modal with inline Tailwind classes
    const modal = document.createElement('div');
    modal.id = 'courseNotesModal';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 1rem; width: 100%; max-width: 1200px; max-height: 90vh; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
            
            <!-- Fixed Header -->
            <div style="position: sticky; top: 0; background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; padding: 1.5rem; border-radius: 1rem 1rem 0 0; display: flex; align-items: center; justify-content: space-between; z-index: 10; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 0.5rem;">
                        <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: bold; margin: 0;">${escapeHtml(courseNote.courseName)}</h2>
                        <p style="font-size: 0.875rem; opacity: 0.8; margin: 0.25rem 0 0 0;">📚 Complete Study Guide & Notes</p>
                    </div>
                </div>
                <button onclick="closeNotesModal()" style="padding: 0.5rem; border: none; background: rgba(255,255,255,0.1); border-radius: 9999px; color: white; cursor: pointer; transition: all 0.2s;">
                    <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Scrollable Content -->
            <div id="notesScrollableContent" style="overflow-y: auto; flex: 1; padding: 2rem; max-height: calc(90vh - 180px);">
                
                ${content.introduction ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Introduction</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Course Overview</p>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #dbeafe, #e0e7ff); border-radius: 0.75rem; padding: 1.5rem; border-left: 4px solid #3b82f6;">
                            <p style="color: #374151; line-height: 1.75; margin: 0;">${escapeHtml(content.introduction)}</p>
                        </div>
                    </div>
                ` : ''}

                ${content.learningObjectives && content.learningObjectives.length > 0 ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.1s backwards;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #10b981, #059669); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Learning Objectives</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">What you'll achieve</p>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 0.75rem; padding: 1.5rem;">
                            ${content.learningObjectives.map((obj, index) => `
                                <div style="display: flex; align-items: start; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 0.5rem; margin-bottom: 0.75rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); transition: all 0.2s;">
                                    <div style="flex-shrink: 0; width: 1.5rem; height: 1.5rem; background: #10b981; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: bold;">
                                        ${index + 1}
                                    </div>
                                    <p style="flex: 1; color: #374151; margin: 0; padding-top: 0.125rem;">${escapeHtml(obj)}</p>
                                    <svg style="width: 1.25rem; height: 1.25rem; color: #10b981; flex-shrink: 0; margin-top: 0.25rem;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${content.keyTopics && content.keyTopics.length > 0 ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.2s backwards;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Key Topics Covered</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Core concepts & modules</p>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                            ${content.keyTopics.map((topic, index) => `
                                <div style="background: white; border-radius: 0.75rem; padding: 1.5rem; border: 2px solid #e9d5ff; transition: all 0.2s; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);" onmouseover="this.style.borderColor='#a78bfa'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#e9d5ff'; this.style.boxShadow='0 1px 3px 0 rgba(0,0,0,0.1)'">
                                    <div style="display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.75rem;">
                                        <div style="flex-shrink: 0; width: 2rem; height: 2rem; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.875rem; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);">
                                            ${index + 1}
                                        </div>
                                        <h4 style="flex: 1; font-weight: bold; color: #1f2937; font-size: 1.125rem; margin: 0;">${escapeHtml(topic.title)}</h4>
                                    </div>
                                    <p style="color: #4b5563; font-size: 0.875rem; line-height: 1.5; margin: 0 0 0.75rem 2.75rem;">${escapeHtml(topic.description)}</p>
                                    <div style="margin-left: 2.75rem; display: flex; align-items: center; color: #8b5cf6; font-size: 0.75rem; font-weight: 500;">
                                        <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                        </svg>
                                        <span>Essential Module</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${content.prerequisites && content.prerequisites.length > 0 ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.3s backwards;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Prerequisites</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Before you start</p>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fed7aa, #fecaca); border-radius: 0.75rem; padding: 1.5rem; border-left: 4px solid #f97316;">
                            ${content.prerequisites.map(prereq => `
                                <div style="display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.5rem;">
                                    <svg style="width: 1.25rem; height: 1.25rem; color: #f97316; margin-top: 0.125rem; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                    </svg>
                                    <span style="color: #374151;">${escapeHtml(prereq)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${content.tips && content.tips.length > 0 ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.4s backwards;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eab308, #ca8a04); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Pro Tips & Best Practices</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Insider secrets for success</p>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${content.tips.map((tip, index) => `
                                <div style="background: linear-gradient(to right, #fef3c7, #fde68a); border-radius: 0.5rem; padding: 1rem; border-left: 4px solid #eab308; transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                                        <div style="flex-shrink: 0; font-size: 1.5rem;">💡</div>
                                        <div style="flex: 1;">
                                            <p style="color: #374151; font-weight: 500; margin: 0;"><span style="color: #ca8a04; font-weight: bold;">Tip ${index + 1}:</span> ${escapeHtml(tip)}</p>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${content.resources && content.resources.length > 0 ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.5s backwards;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.3);">
                                <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; color: #1f2937;">Additional Resources</h3>
                                <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Helpful links & materials</p>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${content.resources.map(resource => `
                                <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" 
                                   style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border-radius: 0.5rem; border: 2px solid #cffafe; text-decoration: none; transition: all 0.2s;" 
                                   onmouseover="this.style.borderColor='#67e8f9'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'; this.querySelector('.arrow').style.transform='translateX(0.25rem)'" 
                                   onmouseout="this.style.borderColor='#cffafe'; this.style.boxShadow='none'; this.querySelector('.arrow').style.transform='translateX(0)'">
                                    <div style="flex-shrink: 0; width: 3rem; height: 3rem; background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                        <svg style="width: 1.5rem; height: 1.5rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1;">
                                        <h4 style="font-weight: bold; color: #1f2937; margin: 0;">${escapeHtml(resource.title)}</h4>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0; text-transform: capitalize;">${escapeHtml(resource.type || 'resource')}</p>
                                    </div>
                                    <svg class="arrow" style="width: 1.25rem; height: 1.25rem; color: #06b6d4; flex-shrink: 0; transition: all 0.2s;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${content.summary ? `
                    <div style="margin-bottom: 2rem; animation: fadeIn 0.5s ease-out 0.6s backwards;">
                        <div style="background: linear-gradient(to right, #6366f1, #8b5cf6, #ec4899); border-radius: 0.75rem; padding: 1.5rem; color: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: start; gap: 1rem;">
                                <div style="flex-shrink: 0; width: 3rem; height: 3rem; background: rgba(255,255,255,0.2); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                                    <svg style="width: 1.75rem; height: 1.75rem;" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <h4 style="font-size: 1.25rem; font-weight: bold; margin: 0 0 0.5rem 0;">Course Summary</h4>
                                    <p style="opacity: 0.9; line-height: 1.75; margin: 0;">${escapeHtml(content.summary)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div style="padding-top: 1rem; border-top: 2px solid #e5e7eb;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.875rem; color: #6b7280;">
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg style="width: 1.25rem; height: 1.25rem; color: #3b82f6;" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                                </svg>
                                <span style="font-weight: 600;">${courseNote.viewCount || 0}</span>
                                <span>views</span>
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg style="width: 1.25rem; height: 1.25rem; color: #10b981;" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                </svg>
                                <span style="font-weight: 600;">${courseNote.downloadCount || 0}</span>
                                <span>downloads</span>
                            </span>
                        </div>
                        <span style="display: flex; align-items: center; gap: 0.5rem;">
                            <svg style="width: 1.25rem; height: 1.25rem; color: #8b5cf6;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                            </svg>
                            <span>Updated ${new Date(courseNote.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Fixed Footer -->
            <div style="position: sticky; bottom: 0; background: linear-gradient(to right, #f9fafb, #f3f4f6); padding: 1rem 1.5rem; border-radius: 0 0 1rem 1rem; display: flex; align-items: center; justify-content: space-between; border-top: 2px solid #e5e7eb; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 0.5rem; height: 0.5rem; background: linear-gradient(to right, #eab308, #f59e0b); border-radius: 9999px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
                    <span style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Pro Feature</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button onclick="closeNotesModal()" style="padding: 0.625rem 1.25rem; border-radius: 0.5rem; border: 2px solid #d1d5db; color: #374151; font-weight: 500; background: white; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='white'">
                        Close
                    </button>
                    <button onclick="downloadCoursePDF('${courseNote.courseId}')" style="padding: 0.625rem 1.25rem; border-radius: 0.5rem; background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);" onmouseover="this.style.boxShadow='0 10px 15px -3px rgba(79, 70, 229, 0.4)'; this.style.transform='scale(1.05)'" onmouseout="this.style.boxShadow='0 4px 6px -1px rgba(79, 70, 229, 0.3)'; this.style.transform='scale(1)'">
                        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add custom scrollbar styles
    const scrollContent = document.getElementById('notesScrollableContent');
    scrollContent.style.scrollBehavior = 'smooth';

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeNotesModal();
        }
    });

    // Close on Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeNotesModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    console.log('✅ Fixed scrollable notes modal displayed');
}

function closeNotesModal() {
    const modal = document.getElementById('courseNotesModal');
    if (modal) {
        modal.style.opacity = '0';
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 200);
    }
}

// Add animation styles
if (!document.getElementById('notes-modal-animations')) {
    const style = document.createElement('style');
    style.id = 'notes-modal-animations';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
        
        #notesScrollableContent::-webkit-scrollbar {
            width: 10px;
        }
        #notesScrollableContent::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        #notesScrollableContent::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #6366f1, #8b5cf6);
            border-radius: 10px;
        }
        #notesScrollableContent::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
    `;
    document.head.appendChild(style);
}

window.showNotesModal = showNotesModal;
window.closeNotesModal = closeNotesModal;

console.log('✅ Fixed course notes modal loaded with proper styling');